// passes
//
// all files
//   1. parser
//   2. generate global state
//
// single file
//   1. parser
//   2. compiler
//   interfacing:
//     foreign methods: find in
// => output.asm

//
// ============================== PARSER           ==============================
//

// missing: function calls, pointer types, type templates

function _ass(val) {
  if (!val) throw new Error('assertion failed.');
}
function _nass(val) {
  if (val) throw new Error('negative assertion failed.');
}

function makeParseState(name, text, i, root, n) {
  return { name, text, i, root, n };
}

function parseFile(name, text) {
  if (text.includes('\r')) throw new Error('Can only parse end of line sequence "LF"');
  let state = makeParseState(name, text, 0, undefined, undefined);
  parse(state);
  return state.root;
}

function parse(state) {
  'use strict';

  function makeNode(name, props, kids) {
    return { name, props, kids, i: state.i };
  }
  // node makers so i don't forget
  const makeNodeRoot = (_) => makeNode('root', undefined, []);
  const makeNodeCode = (name) => makeNode('code', { name }, []);
  const makeNodeData = (name) => makeNode('data', { name }, []);
  const makeNodeCtr = (name) => makeNode('expr-ctr', { name }, []);
  const makeNodeMemberInit = (name) => makeNode('member-init', { name }, []);
  const makeNodeStruct = (name) => makeNode('struct', { name }, []);
  const makeNodeMember = (name) => makeNode('member', { name }, []);
  const makeNodeFunc = (name) => makeNode('func', { name }, []);
  const makeNodeListParam = (_) => makeNode('list-param', undefined, []);
  const makeNodeParam = (name) => makeNode('param', { name }, []);
  const makeNodeListInst = (_) => makeNode('list-inst', undefined, []);
  const makeNodeInsAsm = (_) => makeNode('ins-asm', undefined, []);
  const makeNodeAsm = (_) => makeNode('asm', undefined, []);
  const makeNodeAsmPart = (partType, value) => makeNode('asm-part', { partType, value }); // partType: asm/sus
  const makeNodeInstBlock = () => makeNode('ins-block', undefined, []); // kids: list-inst
  const makeNodeInsDone = (_) => makeNode('ins-done');
  const makeNodeInsBreak = (levels) => makeNode('ins-break', { levels });
  const makeNodeInsSym = (name) => makeNode('ins-sym', { name }, []);
  const makeNodeInsAssign = (_) => makeNode('ins-ass', {}, []);
  const makeNodeInsIf = (_) => makeNode('ins-if', undefined, []); // kids: expr, list-inst
  const makeNodeInsWhile = (_) => makeNode('ins-while', undefined, []); // kids: expr, list-inst
  const makeNodeElse = (_) => makeNode('else', undefined, []); // kids: expr, list-inst
  const makeNodeTarget = (expr) => makeNode('target', undefined, [expr]);
  const makeNodeExpr = (_) => makeNode('expr', {}, []);
  const makeNodeExprSym = (symbol) => makeNode('expr-sym', { symbol });
  const makeNodeExprOp = (op) => makeNode('expr-op', { op }, []);
  const makeNodeExprMemberName = (name) => makeNode('expr-member', { name }, []);
  const makeNodeExprLitDecInt = (decInt) => makeNode('expr-lit', { litType: 'dec-int', value: decInt });
  const makeNodeExprLitBoo = (val) => makeNode('expr-lit', { litType: 'dec-boo', value: val });
  const makeNodeExprLitPtrStr = (str) => makeNode('expr-lit', { litType: 'ptr-str', value: str });
  const makeNodeExprArr = () => makeNode('expr-arr', null, []); // kids: type, expression for size
  const makeNodeExprBrackets = () => makeNode('expr-brackets', null, []); // expression
  const makeNodeExprRef = () => makeNode('expr-ref', null, []); // kids: expression to get pointer of
  const makeNodeExprDrf = () => makeNode('expr-drf', null, []); // kids: expression to express value of
  const makeNodeExprRtp = () => makeNode('expr-reinterpret', null, []); // kids: type, expression
  const makeNodeExprSize = () => makeNode('expr-siz', null, []); // kids: type, expression
  const makeNodeType = (type) => makeNode('type', { type }, []);
  const makeNodeInsCall = (codeName, name) => makeNode('ins-call', { codeName, name }, []);
  const makeNodeArgument = (name) => makeNode('arg', { name }, []);

  // parser helper functions

  function err(msg) {
    return new Error('(parse err) ' + msg + ' at ' + locPrevString());
  }

  function warn(msg) {
    console.warn(msg + ' at ' + locPrevString());
  }

  // note: pattern should start with ^
  // returns the first match found in state.text.slice(state.i) or undefined if not found
  function test(pattern) {
    let str = state.text.slice(state.i);
    let matches = str.match(pattern);
    if (matches) return matches[0];
    return undefined;
  }

  const eatSpace = () => eat(/^[\t ]*/);
  // const eatEmpty = () => eat(/^[\n\t ]*/);
  // const eatEmpty = () => eat(/^[\n\t ]*(#.*\n[\n\t ]*)?/);
  const eatEmpty = () => eat(/^([\n\t ]*(#.*?(\n|$))?)*/);
  const eatFuncName = () => eat(/^[a-zA-Z0-9_]*[a-zA-Z_]+[a-zA-Z0-9_]*/);
  const eatSymbol = () => eat(/^[a-zA-Z0-9_]*[a-zA-Z_]+[a-zA-Z0-9_]*/);
  const eatTypeName = () => eat(/^[a-zA-Z0-9_]*?[a-zA-Z_]+?[a-zA-Z0-9_]*?\/?[a-zA-Z0-9_]*[a-zA-Z_]+[a-zA-Z0-9_]*/);
  const eatLitIntDec = () => eat(/^-?[0-9]+/);
  const eatLitBoo = () => eat(/^(yes|no)/);
  const eatLitStr = () => eat(/^(".*?[^\\]"|"")/);

  // https://stackoverflow.com/a/6969486/13356588
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function eatPicky(str) {
    if (!eat(new RegExp(`^${escapeRegExp(str)}`))) throw err(`expected "${str}"`);
  }

  function eat(pattern) {
    let v = test(pattern);
    if (v) state.i += v.length;
    return v;
  }

  function expect(v, name) {
    if (!v) throw err('expected ' + name);
    return v;
  }

  // adds node to current node and calls sup-parser if defined with current node as added node
  function append(node, subParser) {
    state.n.kids.push(node);

    // call sup-parse if given
    if (subParser) {
      let prev = state.n;
      state.n = node;
      subParser();
      state.n = prev;
    }
  }

  function kidnap(parserFunc) {
    let lastNode = state.n;
    state.n = { name: null, props: {}, kids: [] };
    parserFunc();
    if (state.n.kids.length !== 1) {
      throw new Error('no single node appended');
    }
    let captured = state.n.kids[0];
    state.n = lastNode;
    return captured;
  }

  function locPrevString() {
    let { line, col } = lineNumber(state.text, state.i);
    let l = state.text.slice(Math.max(0, state.i), Math.min(state.text.length, state.i + 50)).replaceAll('\n', '<LF>') + '...';
    return state.name + ':' + line + ':' + col + '\n  ...' + l;
  }

  //
  // start parsing.
  //

  // parse loop at top call base parse method
  state.root = makeNodeRoot();
  state.n = state.root;
  eatEmpty();
  while (!eof()) {
    let prevI = state.i;
    parseBase();
    if (prevI >= state.i) {
      throw err('unparsable statement');
    }
  }

  function eof() {
    return state.i >= state.text.length;
  }

  // parse method for top level statements

  // // note: parse prefix means the node is appended automatically, eatNode prefix means the method returns the node
  // function parseBase() {
  //   if (test(/^func[\n\t ]/)) return parseFunc();
  //   if (tryParseStruct()) return;

  //   return parseTls();
  //   // throw err('unparsable top level statement')
  // }

  function parseBase() {
    if (tryParseCode()) return;
    if (tryParseData()) return;
    throw err('unparsable top level statement');
  }

  function tryParseCode() {
    return tryParse(() => {
      let nodeCode = makeNodeCode(undefined);

      if (!eat(/^code[\n\t ]/)) return;
      eatEmpty();

      let name = eatSymbol();
      nodeCode.props.name = name;
      if (!name) return;
      eatEmpty();

      if (!eat(/^{/)) return;
      eatEmpty();

      append(nodeCode, () => {
        while (
          tryParse(
            () => {
              if (!test(/^func[\n\t ]/)) return;
              parseFunc();
              return true;
            },
            () => {
              if (!eat(/^main(?=[\n\t {])/)) return;
              eatEmpty();
              parseTls();
              return true;
            }
          ) &&
          !eof()
        );
      });
      eatEmpty();

      eatPicky('}');
      eatEmpty();

      return true;
    });
  }

  function tryParseData() {
    return tryParse(() => {
      let nodeData = makeNodeData(undefined);

      if (!eat(/^data[^\n\t ]/)) return;
      eatEmpty();

      let name = eatSymbol();
      nodeData.props.name = name;
      if (!name) return;
      eatEmpty();

      if (!eat(/^{/)) return;
      eatEmpty();

      append(nodeData, () => {
        while (tryParse(tryParseStruct) && !eof());
      });
      eatEmpty();

      eatPicky('}');
      eatEmpty();
    });
  }

  function tryParseStruct() {
    return tryParse(() => {
      if (!eat(/^struct[ \n\t]/)) return;
      eatEmpty();

      let struct = makeNodeStruct(undefined);

      let name = expect(eatSymbol(), 'a struct name');
      struct.props.name = name;
      eatEmpty();

      eatPicky('(');
      eatEmpty();

      let first = true;
      while (!eat(/^\)/)) {
        if (eof()) throw err('unexpected eof');

        if (!first) {
          eatPicky(',');
          eatEmpty();
        }
        first = false;

        let node = makeNodeMember();
        node.kids.push(parseNodeType());

        let name = expect(eatSymbol(), 'a member name');
        eatEmpty();
        node.props.name = name;

        struct.kids.push(node);
      }
      eatEmpty();

      eatPicky(';');
      eatEmpty();

      append(struct);

      return true;
    });
  }

  function parseTls() {
    eatPicky('{');
    eatEmpty();
    parseListInst();
    eatPicky('}');
    eatEmpty();
  }

  function parseListInst() {
    append(makeNodeListInst(), (_) => {
      while (tryParseInst());
    });
  }

  function tryParseInstBlock() {
    return tryParse(() => {
      if (!eat(/^\{/)) return;
      eatEmpty();

      append(makeNodeInstBlock(), () => {
        parseListInst();
      });

      eatPicky('}');
      eatEmpty();
      return true;
    });
  }

  function tryParseInst() {
    if (tryParseInstBlock()) return true;
    if (tryParseInstDone()) return true;
    if (tryParseInstBreak()) return true;
    if (tryParseInstAsm()) return true;
    if (tryParseInstAssignment()) return true;
    if (tryParseInstSym()) return true;
    if (tryParseInstIf()) return true;
    if (tryParseInstWhile()) return true;
    if (tryParseInstCall()) return true;
    return false;
  }

  function tryParseInstWhile() {
    return tryParse(() => {
      if (!eat(/^while/)) return;
      eatEmpty();

      if (!eat(/^\(/)) return;
      eatEmpty();

      let nodeWhile = makeNodeInsWhile();
      nodeWhile.kids.push(parseNodeExpr());

      eatPicky(')');
      eatEmpty();

      nodeWhile.kids.push(
        expect(
          kidnap(() => tryParseInst()),
          'a statement'
        )
      );

      append(nodeWhile);
      return true;
    });
  }

  function tryParseInstIf() {
    return tryParse(() => {
      if (!eat(/^if/)) return;
      eatEmpty();

      if (!eat(/^\(/)) return;
      eatEmpty();

      let nodeIf = makeNodeInsIf();

      nodeIf.kids.push(parseNodeExpr()); // if: expr

      eatPicky(')');
      eatEmpty();

      nodeIf.kids.push(
        expect(
          kidnap(() => tryParseInst()),
          'a statement'
        )
      ); // if: any instruction

      // else

      let nodeElse = tryParse(() => {
        if (!eat(/^else/)) return;

        let space = eatEmpty();
        if ((!space || space.length === 0) && !test(/^\{/)) return;

        let n = makeNodeElse();

        n.kids.push(
          expect(
            kidnap(() => tryParseInst()),
            'a statement'
          )
        ); // else: any instruction

        return n;
      });

      if (nodeElse) nodeIf.kids.push(nodeElse);

      append(nodeIf);
      return true;
    });
  }

  function tryParseInstCall() {
    return tryParse((_) => {
      let name = eatSymbol();
      if (!name) return;
      eatEmpty();

      let codeName = undefined;
      if (eat(/^\//)) {
        eatEmpty();
        codeName = name;
        name = eatSymbol();
        if (!name) return;
      }

      if (!eat(/^\(/)) return;
      eatEmpty();

      append(makeNodeInsCall(codeName, name), (_) => {
        let first = true;
        while (!eat(/^\)/)) {
          if (eof()) throw err('unexpected eof');

          if (!first) {
            eatPicky(',');
            eatEmpty();
          }
          first = false;

          let symbol = eatSymbol();
          eatEmpty();

          eatPicky(':');
          eatEmpty();

          append(makeNodeArgument(symbol), (_) => {
            append(parseNodeExpr());
          });
        }

        eatEmpty();
        eatPicky(';');
        eatEmpty();
      });
      eatEmpty();

      return true;
    });
  }

  function tryParseInstSym() {
    return tryParse((_) => {
      let nodeType = tryParseNodeType();
      if (!nodeType) return undefined;
      eatEmpty();

      let name = eatSymbol();
      if (!name) return undefined;
      eatEmpty();

      eatPicky('=');
      eatEmpty();

      append(makeNodeInsSym(name), (_) => {
        append(nodeType);
        append(parseNodeExpr());
        eatPicky(';');
        eatEmpty();
      });

      return true;
    });
  }

  function tryParseInstAssignment() {
    return tryParse((_) => {
      // try parse left hand
      let nodeTargetExpr = tryParse((_) => {
        let expr = tryParseNodeExpr();
        if (!expr) return;
        return makeNodeTarget(expr);
      });
      if (!nodeTargetExpr) return;

      let equals = eat(/^=/);
      if (!equals) return;
      eatEmpty();

      append(makeNodeInsAssign(), (_) => {
        append(nodeTargetExpr);
        append(parseNodeExpr());
        eatPicky(';');
        eatEmpty();
      });

      return true;
    });
  }

  function parseNodeExpr() {
    return expect(tryParseNodeExpr(), 'expression');
  }

  // parses an expression
  function tryParseNodeExpr() {
    let nodeExpr = makeNodeExpr();

    let nodeCurrent = tryParseNodeExprGreedy();
    if (!nodeCurrent) return undefined;

    while (true) {
      let nodeNew = tryParseNodeExprOp(nodeCurrent);
      if (!nodeNew) break;
      nodeCurrent = nodeNew;
    }

    nodeExpr.kids.push(nodeCurrent);
    return nodeExpr;
  }

  function tryParseNodeExprOp(nodeExprA) {
    return tryParse((_) => {
      let op = eat(/^([+\-*/]|==|!=|>=|<=|>|<|\|\||\&\&)/);
      if (!op) return undefined;
      eatEmpty();
      let n = makeNodeExprOp(op);
      n.kids.push(nodeExprA);
      let second = tryParseNodeExprGreedy();
      if (!second) return;
      n.kids.push(second);
      return n;
    });
  }

  // , () => {
  //     let memberAccessOp = eat(/^\./);
  //     if (!memberAccessOp) return;
  //     eatEmpty();
  //     let memberName = eatSymbol();
  //     eatEmpty();
  //     let n = makeNodeExprMemberName(memberName);
  //     n.kids.push(nodeExprA);
  //     return n;
  //   }

  // tries to parse as much preceding operators as possible
  function tryParseNodeExprGreedy() {
    return tryParse(() => {
      let expr = tryParseNodeExprVal();
      if (!expr) return;

      while (true) {
        if (eof()) throw err('unexpected eof');

        let op = eat(/^(\.)/);
        if (!op) return expr;
        eatEmpty();

        let memberName = eatSymbol();
        eatEmpty();

        let memExpr = makeNodeExprMemberName(memberName);
        memExpr.kids.push(expr);
        expr = memExpr;
      }
    });
  }

  function tryParseNodeExprVal() {
    return tryParse(
      () => {
        if (!eat(/^STR[\t ]*(?=")/)) return;
        let value = eatLitStr();
        return makeNodeExprLitPtrStr(value);
      },
      () => {
        if (!eat(/^ARR/)) return;
        eatEmpty();
        if (!eat(/^\[/)) return;
        let type = parseNodeType();
        eatEmpty();

        eatPicky(']');
        eatEmpty();

        eatPicky('(');
        eatEmpty();

        let arrayNode = makeNodeExprArr();
        arrayNode.kids.push(type);
        arrayNode.kids.push(parseNodeExpr());

        eatPicky(')');
        eatEmpty();

        return arrayNode;
      },
      () => {
        if (!eat(/^\(/)) return;
        eatEmpty();
        let bracketsNode = makeNodeExprBrackets();
        bracketsNode.kids.push(parseNodeExpr());
        eatPicky(')');
        eatEmpty();
        return bracketsNode;
      },
      () => {
        if (!eat(/^REF/)) return;
        eatEmpty();
        if (!eat(/^\(/)) return;
        eatEmpty();
        let refNode = makeNodeExprRef();
        refNode.kids.push(parseNodeExpr());
        eatPicky(')');
        eatEmpty();
        return refNode;
      },
      () => {
        if (!eat(/^DRF/)) return;
        eatEmpty();
        if (!eat(/^\(/)) return;
        eatEmpty();
        let drfNode = makeNodeExprDrf();
        drfNode.kids.push(parseNodeExpr());
        eatPicky(')');
        eatEmpty();
        return drfNode;
      },
      () => {
        if (!eat(/^RTP/)) return;
        eatEmpty();

        if (!eat(/^\[/)) return;
        eatEmpty();

        let nodeType = parseNodeType();

        eatPicky(']');
        eatEmpty();

        eatPicky('(');
        eatEmpty();

        let drfNode = makeNodeExprRtp();
        drfNode.kids.push(nodeType);
        drfNode.kids.push(parseNodeExpr());

        eatPicky(')');
        eatEmpty();

        return drfNode;
      },
      () => {
        if (!eat(/^size/)) return;
        eatEmpty();

        if (!eat(/^\[/)) return;
        eatEmpty();

        let nodeType = parseNodeType();

        eatPicky(']');
        eatEmpty();
        eatPicky('(');
        eatEmpty();
        eatPicky(')');
        eatEmpty();

        let n = makeNodeExprSize();
        n.kids.push(nodeType);
        return n;
      },
      () => {
        let structName = eatSymbol();
        if (!structName) return;
        eatEmpty();

        if (!eat(/^\(/)) return;
        eatEmpty();

        let ctr = makeNodeCtr(structName);

        let first = true;
        while (!eat(/^\)/)) {
          if (eof()) throw err('unexpected eof');

          if (!first) {
            eatPicky(',');
            eatEmpty();
          }
          first = false;

          let symbol = eatSymbol();
          eatEmpty();

          if (!eat(/^=/)) return;
          eatEmpty();

          let memberInit = makeNodeMemberInit(symbol);
          let expr = tryParseNodeExpr();
          if (!expr) return;
          memberInit.kids.push(expr);
          ctr.kids.push(memberInit);
        }
        eatEmpty();

        return ctr;
      },
      (_) => {
        let val = eatLitBoo();
        if (!val) return undefined;
        eatEmpty();
        return makeNodeExprLitBoo(val);
      },
      (_) => {
        let symbol = eatSymbol();
        if (!symbol) return undefined;
        eatEmpty();
        return makeNodeExprSym(symbol);
      },
      (_) => {
        let val = eatLitIntDec();
        if (!val) return undefined;
        eatEmpty();
        return makeNodeExprLitDecInt(val);
      }
    );
  }

  // note: takes var-arg list of functions. first function to succeed in parsing
  // returns its value, on failure to parse undefined is returned.
  function tryParse() {
    let prevI = state.i;
    for (const subParser of arguments) {
      let r = subParser();
      if (r) return r;
      state.i = prevI;
    }
    return undefined;
  }

  function tryParseInstDone() {
    return tryParse(() => {
      if (!eat(/^done/)) return;
      eatEmpty();
      if (!eat(/^;/)) return;
      eatEmpty();
      append(makeNodeInsDone());
      return true;
    });
  }

  function tryParseInstBreak() {
    return tryParse(() => {
      if (!eat(/^break/)) return;

      let space = eatEmpty();
      if ((!space || space.length === 0) && !test(/^;/)) return;

      let levels = eat(/^[0-9]+/);
      eatEmpty();

      if (!eat(/^;/)) return;
      eatEmpty();

      if (!levels) levels = 1;
      else levels = +levels;

      append(makeNodeInsBreak(levels));
      return true;
    });
  }

  function tryParseInstAsm() {
    return tryParse(() => {
      if (!eat(/^ASM/)) return;
      eatEmpty();

      if (!eat(/^{/)) return;
      eatEmpty();

      append(makeNodeInsAsm(), (_) => {
        // eatPicky('\n');
        // expect(eat(/^\n/), 'new line');
        // eatEmpty();

        while (!eat(/^}/)) {
          if (eof()) throw err('unexpected eof');

          append(makeNodeAsm(), (_) => {
            while (!eat(/^\n/)) {
              if (eof()) throw err('unexpected eof');

              if (eat(/^SUS[\t ]*\{/)) {
                eatSpace();
                let symbol = expect(eatSymbol(), 'symbol in asm statement');
                eatSpace();
                eatPicky('}');
                eatSpace();

                append(makeNodeAsmPart('sus', symbol));
                continue;
              }

              // note: matches till end of line or till last character before next sus {
              let asmPart = eat(/^.*?(?=(SUS[\t ]*\{|\n))/);
              if (asmPart) {
                append(makeNodeAsmPart('asm', asmPart));
                eatSpace();
                continue;
              }

              throw err('could not parse asm line');
            }
            eatEmpty();
          });
        }

        eatEmpty();
      });
      return true;
    });
  }

  function parseFunc() {
    eatPicky('func ');
    eatEmpty();

    let name = eatFuncName();
    eatEmpty();

    append(makeNodeFunc(name), (_) => {
      eatPicky('(');
      eatEmpty();

      append(makeNodeListParam(), (_) => {
        let first = true;
        while (!test(/^\)/)) {
          if (eof()) throw err('unexpected eof');

          if (!first) {
            eatPicky(',');
            eatEmpty();
          }
          first = false;

          append(makeNodeParam(name), (_) => {
            append(parseNodeType());

            let paramName = expect(eatSymbol(), 'a symbol');
            eatEmpty();
            state.n.props.name = paramName;
          });
        }
      });

      eatPicky(')');
      eatEmpty();

      eatPicky('{');
      eatEmpty();

      parseListInst();

      eatPicky('}');
      eatEmpty();
    });
  }

  function tryParseNodeType() {
    return tryParse((_) => {
      let type = tryParseType();
      if (!type) return;
      let typeNode = makeNodeType(type);
      return typeNode;
    });
  }

  function tryParseType() {
    return tryParse((_) => {
      let name = eatTypeName();
      eatEmpty();

      if (!name) return undefined;

      let isPrimitive = name.match(/^(int8|int32|boo|PTR|ptr)(?![a-zA-Z0-9_\[<])/);
      if (isPrimitive) {
        if (eat(/^\[/)) {
          eatEmpty();
          let insideType = tryParseType();
          if (!insideType) return undefined;
          if (!eat(/^\]/)) return undefined;
          eatEmpty();
          let type = makeTypePrim(name, [insideType]);
          return type;
        }

        return makeTypePrim(name);
      } else {
        return makeTypeStruct(name);
      }

      return undefined;
    });
  }

  function parseNodeType() {
    return expect(tryParseNodeType(), 'a type');
  }
}

//
// ============================== COMPILER         ==============================
//

// NOTES
//  using goofy calling convention (like __stdcall but caller cleans stack instead of callee)

function makeCompileState(ctx, name, text, isMain, root, n) {
  return { ctx, name, text, isMain, root, n };
}

function compile(state) {
  'use strict';

  // HELPERS ============================

  function makeImplErr(msg) {
    return new Error('COMPILER IMPLEMENTATION ERROR: ' + msg);
  }

  function makeErr(i, msg) {
    let locMsg = i ? ' at ' + getLocErr(i) : '';
    return new Error('(compile err) ' + msg + locMsg);
  }

  function getLocErr(i) {
    let { line, col } = lineNumber(state.text, i);
    let l = state.text.slice(Math.max(0, i), Math.min(state.text.length, i + 50)).replaceAll('\n', '<LF>') + '...';
    return state.name + ':' + line + ':' + col + '\n  ...' + l;
  }

  function getLoc(i) {
    let { line, col } = lineNumber(state.text, i);
    return state.name + ':' + line + ':' + col;
  }

  let currentIndent = 0;

  function indented(compileFunc) {
    currentIndent++;
    compileFunc();
    currentIndent--;
  }

  function line(str = '', indentLevelCount = 1) {
    if (str == '') return '\n';
    return '  '.repeat(currentIndent + indentLevelCount) + str + '\n';
  }

  const makeStructTable = (rows) => ({ rows });
  const makeStructTableRow = (name, type, members, size) => ({ name, type, members, size });
  const makeStructTableRowMember = (name, type, off) => ({ name, type, off });
  let structTable = null;
  function findStructTableRow(name) {
    return structTable.rows.find((x) => x.name === name);
  }

  // STRING LITERALS ============================

  const makeDataTable = (strings) => ({ strings });
  const makeDataTableRowStr = (asmName) => ({ asmName });
  const newAsmNameLitPtrStr = () => 'ss_' + (1 + Object.keys(dataTable.strings).length);
  const findAsmNameLitPtrStr = (value) => dataTable.strings[value]?.asmName;
  let dataTable = null;

  // /

  // SCOPES ======================================

  // note on offset layout:
  // ...
  // ebp -n   = second local variable, where n is size of first local variable
  // ebp      = first local variable
  // ebp +4   = base pointer of last scope
  // ebp +8   = return address
  // ebp +8+n = first param of scope where n is size of param (params are rtl)
  // ...
  //
  // also: in functions the caller does the stack cleanup.

  const makeSymTable = (rows, size) => ({ rows, size }); // includes params and locals, note that params are not included in size
  const makeSymTableRow = (symbol, type, off, size) => ({ symbol, type, off, size }); // symbol: name, type: node, off: ebp off bytes.  size: bytes
  const makeScope = (endAsmName, parent, symTable) => ({ endAsmName, parent, symTable });
  const makeSymTableLoc = (scopes, row) => ({ scopes, row });

  function findSymTableLoc(scope, sym, scopes = []) {
    if (scope === undefined) return undefined;

    scopes.push(scope);

    let row = scope.symTable.rows.find((x) => x.symbol === sym);
    if (row) return makeSymTableLoc(scopes, row);

    return findSymTableLoc(scope.parent, sym, scopes);
  }

  function createScope(endAsmName, listParam, listIns, parent) {
    let scope = makeScope(endAsmName, parent, makeSymTable([], 0));

    let table = scope.symTable;

    let paramOffset = 8;
    if (listParam) {
      for (const param of listParam.kids) {
        let type = param.kids.find((x) => x.name === 'type').props.type;
        let name = param.props.name;
        let size = evalSize(type);
        if (findSymTableLoc(scope, name)) throw makeErr(param.i, 'duplicate symbol: ' + name);
        paramOffset += size;
        table.rows.push(makeSymTableRow(name, type, paramOffset, size));
      }
    }

    let symOffset = 0;
    for (const ins of listIns.kids) {
      if (ins.name !== 'ins-sym') continue;
      let type = ins.kids.find((x) => x.name === 'type').props.type;
      let name = ins.props.name;
      let size = evalSize(type);
      if (findSymTableLoc(scope, name)) throw makeErr(ins.i, 'duplicate symbol: ' + name);
      table.rows.push(makeSymTableRow(name, type, symOffset, size));
      table.size += size;
      symOffset -= size;
    }

    return scope;
  }

  // /

  // EXPRESSIONS ============================

  // gives size in bytes
  function evalSizeAligned(type) {
    let r = evalSize(type);
    if (r % 4 !== 0) throw makeImplErr('unaligned!');
    return r;
  }

  function evalSize(type, depth = 1000) {
    _ass(type.kind);

    if (depth < 0) {
      throw makeErr(undefined, 'recursive struct definition ' + JSON.stringify(typeIn));
    }

    if (type.kind === 'struct') {
      let name = type.name;

      let structRow = findStructTableRow(name);
      if (!structRow) {
        throw makeErr(undefined, 'could not find struct ' + name);
      }
      if (structRow.size !== undefined) return structRow.size;

      let r = 0;
      for (const member of structRow.members) {
        r += evalSize(member.type, depth - 1);
      }
      structRow.size = r;
      return r;
    } else if (type.kind === 'prim') {
      // type.props
      // if (prim.name.startsWith('')) return 4;
      switch (type.name) {
        case 'boo':
        case 'int8':
        case 'int32':
        case 'ptr':
        case 'PTR':
          return 4;
        default:
          throw makeImplErr('unknown primitive type: ' + type.kind);
      }
    } else {
      throw makeImplErr('unknown type: ' + type.kind);
    }
  }

  // /

  // FUNCTIONS ============================

  function findFunc(name, paramNames) {
    paramNames = [...paramNames].sort();

    return state.root.kids
      .filter(x => x.name === 'code')
      .flatMap(x => x.kids)
      .filter(x => x.name == 'func')
      .find((x) => {
        if (x.props.name !== name) return false;

        let params = x.kids[0].kids; // func.list-param.kids
        let pn = params.map((x) => x.props.name).sort();

        if (pn.length !== paramNames.length) return false;
        for (let i = 0; i < paramNames.length; i++) {
          if (pn[i] !== paramNames[i]) return false;
        }

        return true;
      });
  }

  // note on valid nasm names: letters, numbers, _, $, #, @, ~, ., and ?. The only characters which may be used as the first character of an identifier are letters, .

  function getAsmNameFunc(func) {
    let params = func.kids[0].kids; // func.list-param.kids
    let paramString = params
      .map((x) => x.props.name)
      .sort()
      .join('#');
    return 'sf_' + func.props.name + '@' + paramString;
  }

  // /

  // ASM HELPERS ============================

  function strLitToAsm(strLit) {
    let value = strLit.props.value;
    let v = value.slice(1, value.length - 1);
    v = v.replaceAll('\\"', '"').replaceAll('\\n', '\n');
    let val = v.match(/\\[^\\]/);
    if (val) throw makeErr(strLit.i, 'unknown escape sequence ' + val);
    v = v.replace('\\\\', '\\');
    let r = '';
    let inStr = false;
    for (let i = 0; i < v.length; i++) {
      let c = v[i];
      let newInstr = c.match(/^[a-zA-Z0-9,-_ \.\/]/);
      if (newInstr) {
        if (!inStr) {
          if (r.length > 0) r += ', ';
          r += "'";
        }
        r += c;
      } else {
        if (inStr) r += "'";
        if (r.length > 0) r += ', ';
        r += c.codePointAt(0);
      }
      inStr = newInstr;
    }
    if (inStr) r += "'";
    if (r.length > 0) r += ', ';
    r += '0';
    return r;
  }

  function getOffStr(off) {
    let mag = Math.abs(off);
    let offStr = off < 0 ? ' - ' + mag : off > 0 ? ' + ' + mag : '';
    return offStr;
  }

  // /

  // TYPE-CHECKING METHODS ===================================

  function isTypePrimitive(type) {
    _ass(type.kind);
    return type.kind === 'prim';
  }

  function checkType(expr, scope, expectedType) {
    let exprType = evalType(expr, scope);

    if (typeToString(exprType) !== typeToString(expectedType)) {
      throw makeErr(expr.i, 'expected type ' + typeToString(expectedType) + ' but got ' + typeToString(exprType));
    }
  }

  function checkTypeName(expr, scope, expectedTypeName) {
    let exprType = evalType(expr, scope);

    if (typeToString(exprType) !== expectedTypeName) {
      throw makeErr(expr.i, 'expected type ' + expectedTypeName + ' but got ' + typeToString(exprType));
    }
  }

  function evalTypeReinterpret(expr, scope) {
    let wantedType = expr.kids[0].props.type;
    _ass(wantedType);

    let kid = expr.kids[1];
    let actualType = evalType(kid, scope);

    return wantedType; // lol
    //switch (typeBaseName(actualType)) {
    //  case 'PTR':
    //  case 'ptr':
    //    if (['int32'].includes(typeToString(wantedType))) return wantedType;
    //    throw makeErr(expr.i, 'cannot convert type ' + typeToString(actualType) + ' to ' + typeToString(wantedType));
    //  default:
    //    throw makeErr(expr.i, 'cannot convert type ' + typeToString(actualType));
    //}
  }

  function evalType(expr, scope) {
    let type = evalTypeTesting(expr, scope);
    _ass(type.kind);
    return type;
  }

  function evalTypeTesting(exprParam, scope) {
    let expr = exprParam.name === 'expr' ? exprParam.kids[0] : exprParam;

    if (expr.name === 'expr-reinterpret') {
      return evalTypeReinterpret(expr, scope);
    } else if (expr.name === 'expr-siz') {
      return makeTypePrim('int32');
    } else if (expr.name === 'expr-lit') {
      switch (expr.props.litType) {
        case 'dec-boo':
          return makeTypePrim('boo');
        case 'dec-int':
          return makeTypePrim('int32');
        case 'ptr-str':
          return makeTypePrim('PTR', [makeTypePrim('int8')]);
        default:
          throw makeImplErr('unknown literal type: ' + expr.props.litType);
      }
    } else if (expr.name === 'expr-op') {
      function allowedNum(type) {
        if (!isTypePrimitive(type)) return false;
        if (!['int32', 'ptr', 'PTR'].includes(typeBaseName(type))) return false;
        return true;
      }
      function allowedEq(type) {
        if (!isTypePrimitive(type)) return false;
        if (!['boo', 'int32', 'ptr', 'PTR'].includes(typeBaseName(type))) return false;
        return true;
      }
      const allowedComp = allowedEq;
      function allowedBoo(type) {
        if (!isTypePrimitive(type)) return false;
        if (typeBaseName(type) !== 'boo') return false;
        return true;
      }
      let op = expr.props.op;
      switch (op) {
        case '!=':
        case '==':
          // prettier-ignore
          return evalBinOp(op, expr, scope, allowedEq, (a, b) => true, (a, b) => makeTypePrim('boo') );
        case '<':
        case '>':
        case '<=':
        case '>=':
          // prettier-ignore
          return evalBinOp(op, expr, scope, allowedComp, (a, b) => true, (a, b) => makeTypePrim('boo') );
        case '+':
        case '-':
        case '*':
        case '/':
          // prettier-ignore
          return evalBinOp(op, expr, scope, allowedNum, (a, b) => true, (a, b) => a );
        case '||':
        case '&&':
          // prettier-ignore
          return evalBinOp(op, expr, scope, allowedBoo, (a, b) => true, (a, b) => a );
        default:
          throw makeImplErr('unknown op ' + expr.props.op);
      }
    } else if (expr.name === 'expr-member') {
      let tyeExpr = expr.kids[0];
      let memberName = expr.props.name;
      let structType = evalType(tyeExpr, scope);
      let structName = structType.name;
      let structRow = findStructTableRow(structName);
      if (!structRow) throw makeErr(expr.i, 'unknown struct: ' + structName);
      let member = structRow.members.find((x) => x.name === memberName);
      if (!member) throw makeErr(expr.i, 'not a member of ' + structName + ': ' + memberName);
      return member.type;
    } else if (expr.name === 'expr-sym') {
      let loc = findSymTableLoc(scope, expr.props.symbol);
      if (!loc) throw makeErr(expr.i, 'can not find symbol ' + expr.props.symbol);
      return loc.row.type;
    } else if (expr.name === 'expr-ctr') {
      let row = findStructTableRow(expr.props.name);
      return row.type;
    } else if (expr.name === 'expr-arr') {
      let type = expr.kids.find((x) => x.name === 'type').props.type;
      _ass(type);
      return makeTypePrim('PTR', [type]);
    } else if (expr.name === 'expr-ref') {
      let kidExpr = expr.kids[0];
      let type = evalType(kidExpr, scope);
      return makeTypePrim('PTR', [type]);
    } else if (expr.name === 'expr-brackets') {
      let kidExpr = expr.kids[0];
      return evalType(kidExpr, scope);
    } else if (expr.name === 'expr-drf') {
      let paramExpr = expr.kids[0];
      let type = evalType(paramExpr, scope);
      if (!isTypePrimitive(type)) throw makeErr(expr.i, 'dereferencing non-pointer type ' + typeToString(type));
      if (type.name != 'PTR') throw makeErr(expr.i, 'dereferencing non-pointer type ' + typeToString(type));
      let pointedType = type.args[0];
      return pointedType;
    } else {
      throw makeImplErr('unknown expression ' + expr.name);
    }
    throw makeImplErr('?');
  }

  function evalBinOp(op, expr, scope, allowedFunc, compatibleFunc, typeFunc) {
    let a = expr.kids[0];
    let b = expr.kids[1];
    let typeA = evalType(a, scope);
    let typeB = evalType(b, scope);
    if (!allowedFunc(typeA)) throw makeErr(expr.i, 'op ' + op + ' not supported for type ' + typeToString(typeA));
    if (!allowedFunc(typeB)) throw makeErr(expr.i, 'op ' + op + ' not supported for type ' + typeToString(typeB));
    if (!compatibleFunc(typeA, typeB)) throw makeErr(expr.i, 'op ' + op + ' not compatible for types ' + typeToString(typeA) + ' and ' + typeToString(typeB));
    return typeFunc(typeA, typeB);
  }

  // /

  // COMPILATION METHODS ============================================

  function baseCompileStructTable() {
    structTable = makeStructTable([]);

    for (const strct of state.root.kids) {
      if (strct.name !== 'struct') continue;

      let name = strct.props.name;

      if (findStructTableRow(name)) {
        throw makeErr(strct.i, 'same struct found twice');
      }
      let members = []; //struct.kids.map(x => );
      let off = 0;
      for (const m of strct.kids) {
        members.push(makeStructTableRowMember(m.props.name, m.kids[0], off));
        off += evalSize(m.kids[0].props.type);
      }

      let type = makeTypeStruct(name);

      structTable.rows.push(makeStructTableRow(name, type, members, off));
    }
  }

  function baseCompileDataTable() {
    let r = '';

    dataTable = makeDataTable({});

    function traverse(node) {
      // const makeNodeExprLitPtrStr = (str) => makeNode('expr-lit', { litType: 'ptr-str', value: str });
      if (node.name === 'expr-lit' && node.props.litType === 'ptr-str') {
        let value = node.props.value;
        if (!findAsmNameLitPtrStr(value)) {
          r += line(`;   str at ${getLoc(node.i)}`, 0);
          let asmName = newAsmNameLitPtrStr();
          r += line(asmName + ':', 0);
          r += line('db ' + strLitToAsm(node));
          dataTable.strings[value] = makeDataTableRowStr(asmName);
        }
      }
      for (const k of node.kids ?? []) traverse(k);
    }
    traverse(state.root);

    return r;
  }

  function getAsmNameTls(ins) {
    let { line, col } = lineNumber(state.text, ins.i);
    return 'st__tls_' + line + '_' + col;
  }

  function baseCompileMain() {
    let asm = '';
    
    let mainFound = false;
    for (const kid of state.root.kids) {
      if (kid.name !== 'code') continue;

      for (const listIns of kid.kids) {
        if (listIns.name !== 'list-inst') continue;
        if (listIns.kids.length === 0) continue;
        if (!state.isMain) throw makeErr(listIns.i, 'can only use main block in main.sus');

        if (mainFound) throw makeErr(listIns.i, 'can only have one main block')

        let endAsmName = getAsmNameTls(listIns) + '_end';

        asm += line(`;   main block at ${(getLoc(listIns.i) + '   ').padEnd(35, '=')} {`);
        asm += compileScope(listIns, createScope(endAsmName, undefined, listIns));
        asm += line(`; } main block at ${getLoc(listIns.i).padEnd(35, ' ')} `);
        asm += line();
        mainFound = true;
      }
    }

    if (!mainFound && state.isMain) throw new makeErr('no main block found in any code of main.sus')

    return asm;
  }

  function compileFunc(func) {
    let asm = '';
    let asmName = getAsmNameFunc(func);
    let asmNameEnd = getAsmNameFunc(func) + '@end';
    asm += line(`;   func at ${(getLoc(func.i) + '   ').padEnd(35, '=')} {`, 0);
    asm += line(asmName + ':', 0);
    let listIns = func.kids.find((x) => x.name === 'list-inst');
    let listParam = func.kids.find((x) => x.name === 'list-param');
    asm += compileScope(listIns, createScope(asmNameEnd, listParam, listIns));
    asm += line(`ret`);
    asm += line(`; } func at ${getLoc(func.i).padEnd(35, ' ')} `, 0);
    asm += line();
    return asm;
  }

  function compileScope(listIns, scope) {
    let r = '';

    r += line('push    ebp');
    r += line('lea     ebp, [esp - 4]'); // ebp points to first variable
    if (scope.symTable.size > 0) r += line('sub     esp, ' + scope.symTable.size);
    r += line('');

    for (const ins of listIns.kids) {
      r += compileIns(ins, scope);
    }

    r += line(scope.endAsmName + ':', 0);

    r += line('lea     esp, [ebp + 8]');
    r += line('mov     ebp, [ebp + 4]');

    return r;
  }

  function compileIns(ins, scope) {
    switch (ins.name) {
      case 'ins-sym':
        return compileInsSym(ins, scope);
      case 'ins-ass':
        return compileInsAss(ins, scope);
      case 'ins-call':
        return compileInsCall(ins, scope);
      case 'ins-asm':
        return compileInsAsm(ins, scope);
      case 'ins-block':
        return compileInsBlock(ins, scope);
      case 'ins-if':
        return compileInsIf(ins, scope);
      case 'ins-while':
        return compileInsWhile(ins, scope);
      case 'ins-done':
        return compileInsDone(ins, scope);
      case 'ins-break':
        return compileInsBreak(ins, scope);
      default:
        throw makeImplErr('unsupported statement: ' + ins.name);
    }
  }

  function compileExit(ins, scope, levels) {
    let r = '';

    let scopes = (function findRoot(s, scopes = []) {
      scopes.push(s);
      return s.parent === undefined ? scopes : findRoot(s.parent, scopes);
    })(scope);

    let lv = scopes.length - 1;
    if (levels) {
      if (levels < 1) throw makeErr(ins.i, 'break level too small');
      if (levels >= scopes.length) throw makeErr(ins.i, 'use done instead');
      lv = levels - 1;
    }

    for (let i = 0; i < lv; i++) {
      r += line('lea     esp, [ebp + 8]');
      r += line('mov     ebp, [ebp + 4]');
    }
    r += line(`jmp     ${scopes[lv].endAsmName}`);

    return r;
  }

  function compileInsBreak(ins, scope) {
    return compileExit(ins, scope, ins.props.levels);
  }

  function compileInsDone(ins, scope) {
    return compileExit(ins, scope);
  }

  function getAsmNameIf(insIf) {
    let { line, col } = lineNumber(state.text, insIf.i);
    return 'ss__if_' + line + '_' + col;
  }

  function getAsmNameWhile(insIf) {
    let { line, col } = lineNumber(state.text, insIf.i);
    return 'ss__while_' + line + '_' + col;
  }

  function compileInsIf(insIf, scope) {
    let r = '';

    let asmName = getAsmNameIf(insIf);
    let asmNameYes = asmName + '_yes';
    let asmNameElse = asmName + '_else';
    let asmNameEnd = asmName + '_end';

    let expr = insIf.kids[0];
    let ins = insIf.kids[1];
    let nodeElse = insIf.kids.length >= 3 ? insIf.kids[2] : undefined;

    checkTypeName(expr, scope, 'boo');

    r += compileExpr(expr, scope);
    r += line(`pop     eax`);
    r += line(`cmp     eax, 1`);
    r += line(`jne     ${nodeElse ? asmNameElse : asmNameEnd}`);

    r += line(asmNameYes + ':');
    indented(() => {
      r += compileIns(ins, scope);
      r += line(`jmp     ${asmNameEnd}`);
    });

    if (nodeElse) {
      let elseIns = nodeElse.kids[0];
      r += line(asmNameElse + ':');
      indented(() => {
        r += compileIns(elseIns, scope);
      });
    }

    r += line(asmNameEnd + ':');
    r += line();

    return r;
  }

  function compileInsWhile(insIf, scope) {
    let r = '';

    let asmName = getAsmNameWhile(insIf);
    let asmNameTop = asmName + '_top';
    let asmNameEnd = asmName + '_end';

    let expr = insIf.kids[0];
    let ins = insIf.kids[1];

    checkTypeName(expr, scope, 'boo');

    r += line(`${asmNameTop}:`);
    r += compileExpr(expr, scope);
    r += line(`pop     eax`);
    r += line(`cmp     eax, 1`);
    r += line(`jne     ${asmNameEnd}`);

    indented(() => {
      r += compileIns(ins, scope);
      r += line(`jmp     ${asmNameTop}`);
    });

    r += line(asmNameEnd + ':');
    r += line();

    return r;
  }

  function getAsmNameBlock(ins) {
    let { line, col } = lineNumber(state.text, ins.i);
    return 'ss__bloc_' + line + '_' + col;
  }

  function compileInsBlock(block, scope) {
    let r = '';
    let listIns = block.kids[0];

    let asmNameBlockEnd = getAsmNameBlock(block) + '_end';

    r += line(`;   bloc at ${(getLoc(block.i) + '   ').padEnd(35, '=')} {`);
    indented(() => (r += compileScope(listIns, createScope(asmNameBlockEnd, undefined, listIns, scope))));
    r += line(`; } bloc at ${getLoc(block.i).padEnd(35, ' ')} `, 0);

    return r;
  }

  function compileInsAss(ins, scope) {
    let r = '';

    let targetExpr = ins.kids[0].kids[0].kids[0]; // ins.target.expr.kids[0]
    let expr = ins.kids[1].kids[0]; // ins.expr.kids[0]

    let targetType = evalType(targetExpr, scope);
    let exprType = evalType(expr, scope);
    if (!typeEquals(targetType, exprType)) throw makeErr(ins.i, 'target of type ' + typeToString(targetType) + ' can not be assigned to type ' + typeToString(exprType));

    switch (targetExpr.name) {
      case 'expr-drf':
        let byteSize = evalSizeAligned(exprType);

        r += line(`; deref assign`);
        r += compileExpr(expr, scope);

        r += compileExpr(targetExpr.kids[0], scope);
        r += line(`pop     edx`);

        r += compileCopy('esp', 0, 'edx', 0, byteSize, true);
        r += line(`add     esp, ${byteSize}`);
        break;
      case 'expr-sym':
        r += compileInsAssSym(targetExpr, expr, scope);
        break;
      case 'expr-member':
        r += compileInsAssMember(targetExpr, expr, scope);
        break;
      default:
        throw makeErr(targetExpr.i, 'expression ' + targetExpr.name + ' can not be assigned');
    }

    return r;
  }

  // if (structExpr.name === 'expr-drf') {
  //   throw makeImplErr('get dereferenced struct');
  // } else if (structExpr.name === 'expr-sym') {
  //   let loc = findSymTableLoc(scope, structExpr.props.symbol);
  //   if (!loc) throw makeErr(expr.i, 'can not find symbol ' + symbol);
  //   let row = loc.row;
  //   let symRes = resolveSymbolBase(loc);
  //   r += symRes.asm;
  //   let off = row.off + member.off;
  //   r += line(`mov     eax, [${symRes.register}${getOffStr(off)}] ; member ref: ${structExpr.props.symbol}.${memberName}`);
  //   r += line(`push    eax`);
  // } else {
  //   throw makeImplErr('cannot access struct member of expression ' + structExpr.name);
  // }

  function compileInsAssMember(exprMem, expr, scope) {
    let r = '';

    let chain = resolveMemberChain(scope, exprMem);
    let memberChainString = chain.members.map((x) => x.name).join('.');
    let structExpr = chain.baseExpr;
    let member = chain.members[0];

    checkType(expr, scope, member.type);

    let memberSizeBytes = evalSize(member.type);

    if (structExpr.name === 'expr-sym') {
      let symbol = structExpr.props.symbol;

      let symLoc = findSymTableLoc(scope, symbol);
      if (!symLoc) throw makeErr(structExpr.i, 'can not find symbol ' + symbol);
      let symRow = symLoc.row;

      r += line(`; member assign: ${symbol}.${memberChainString}`);

      r += compileExpr(expr, scope);

      let symRes = resolveSymbolBase(symLoc);
      r += symRes.asm;

      let off = symRow.off + chain.off;

      r += compileCopy('esp', 0, 'ebp', off, memberSizeBytes, true);
      r += line(`add     esp, ${memberSizeBytes}`);

      r += line();
    } else if (structExpr.name === 'expr-drf') {
      let addressExpr = structExpr.kids[0];

      r += line(`; member deref assign ${memberChainString}`);
      r += compileExpr(expr, scope);

      r += compileExpr(addressExpr, scope);
      r += line(`pop     edx`);

      let off = chain.off;
      r += compileCopy('esp', 0, 'edx', off, memberSizeBytes, true);
      r += line(`add     esp, ${memberSizeBytes}`);

      r += line();
    } else {
      throw makeErr(exprMem.i, 'cannot assign struct member of expression ' + structExpr.name);
    }

    return r;
  }

  function compileInsAssSym(exprSym, expr, scope) {
    let r = '';

    let symbol = exprSym.props.symbol;

    let loc = findSymTableLoc(scope, symbol);
    if (!loc) throw makeErr(targetExpr.i, 'can not find symbol ' + symbol);
    let symRow = loc.row;
    let type = symRow.type;
    let byteSize = evalSize(type);

    r += line(`; symbol assign: ${symbol}`);
    r += compileExpr(expr, scope);

    let symRes = resolveSymbolBase(loc);
    r += symRes.asm;

    // r += line('pop     eax');
    // r += line(`mov     [${symRes.register}${getOffStr(row.off)}], eax`);

    r += compileCopy('esp', 0, symRes.register, symRow.off, byteSize, true);
    r += line(`add     esp, ${byteSize}`);

    r += line();

    return r;
  }

  // note: generated assembly does not preserve edx
  function resolveSymbolBase(loc) {
    let r = '';
    let amount = loc.scopes.length - 1;
    if (amount === 0) return { asm: r, register: 'ebp' };
    r += line(`mov     edx, [ebp + 4]`);
    for (let i = 1; i < amount; i++) {
      r += line(`mov     edx, [edx + 4]`);
    }
    return { asm: r, register: 'edx' };
  }

  function compileInsSym(ins, scope) {
    let r = '';

    // todo: only allow usage of sym after this.
    let expr = ins.kids.find((x) => x.name === 'expr');
    let type = ins.kids.find((x) => x.name === 'type').props.type;

    checkType(expr, scope, type);

    let symbol = ins.props.name;
    let loc = findSymTableLoc(scope, symbol);
    let symRow = loc.row;

    let byteSize = evalSize(symRow.type);

    r += line(`; symbol init: ${symbol}`);
    r += compileExpr(expr, scope);

    let symRes = resolveSymbolBase(loc);

    r += symRes.asm;

    r += compileCopy('esp', 0, symRes.register, symRow.off, byteSize, true);
    r += line(`add     esp, ${byteSize}`);

    r += line(``);

    return r;
  }

  // already uses: eax
  function compileCopy(fromReg, fromOffBytes, toReg, toOffBytes, sizeBytes, reverse = false) {
    if ([fromReg, toReg].includes('eax')) throw makeImplErr('lol');

    let r = '';
    if (sizeBytes % 4 !== 0) throw makeImplErr('can only copy 4-byte aligned');
    let sizeStack = sizeBytes / 4;
    for (let i = 0; i < sizeStack; i++) {
      let elementOffsetBytes = i * 4;
      if (reverse) {
        r += line(`mov     eax, [${fromReg}${getOffStr(fromOffBytes + (sizeStack - 1 - i) * 4)}]`);
      } else {
        r += line(`mov     eax, [${fromReg}${getOffStr(fromOffBytes + elementOffsetBytes)}]`);
      }
      r += line(`mov     [${toReg}${getOffStr(toOffBytes + elementOffsetBytes)}], eax`);
    }
    return r;
  }

  function compileInsCall(ins, scope) {
    let r = '';

    r += line('; call');

    let args = ins.kids.filter((x) => x.name === 'arg');
    let paramNames = args.map((x) => x.props.name).sort();

    let func = findFunc(ins.props.name, paramNames);
    if (!func) throw makeErr(ins.i, 'unknown function: ' + ins.props.name);
    let params = func.kids.find((x) => x.name === 'list-param').kids;

    if (params.length < args.length) throw makeErr(ins.i, 'to many arguments for ' + func.props.name);

    let size = 0;
    for (const param of [...params].reverse()) {
      let arg = args.find((x) => x.props.name == param.props.name);
      if (!arg) throw makeErr(ins.i, 'can not find argument for param ' + param.props.name);

      let expr = arg.kids.find((x) => x.name === 'expr');
      let type = param.kids.find((x) => x.name === 'type').props.type;

      checkType(expr, scope, type);

      size += evalSize(type);

      r += compileExpr(expr, scope);
    }

    r += line('call    ' + getAsmNameFunc(func));

    if (size > 0) {
      r += line(`add     esp, ${size}`);
    }

    r += line();

    return r;
  }

  function compileInsAsm(ins, scope) {
    let r = '';
    r += line('; asm');
    for (const nodeAsm of ins.kids) {
      let lineRes = '';
      for (const part of nodeAsm.kids) {
        if (part.props.partType === 'asm') {
          lineRes += part.props.value;
        } else if (part.props.partType === 'sus') {
          let symbol = part.props.value;
          let loc = findSymTableLoc(scope, symbol);
          if (!loc) throw makeErr(part.i, 'can not find symbol ' + symbol);
          if (loc.scopes.length > 1) throw makeErr(part.i, 'can only use symbols in same scope');
          let row = loc.row;

          if (loc.scopes.length !== 1) throw makeErr('can only use local variables in asm instructions');
          lineRes += `[ebp${getOffStr(row.off)}]`; // ; ${symbol}
        } else throw Error();
      }
      r += line(lineRes);
    }
    r += line();
    return r;
  }

  // always generates asm to push (very inefficient lol)
  // const makeNodeExpr = (_) => makeNode('expr', 'expr-sym', 'expr-op',  'expr-lit' ('dec-int' 13254, 'ptr-str' "asdf"});
  function compileExpr(expr, scope) {
    if (scope === undefined) throw makeImplErr('undefined scope');
    if (expr.name === 'expr') return compileExpr(expr.kids[0], scope);

    let asm = '';
    if (expr.name === 'expr-reinterpret') {
      asm += compileExprReinterpret(expr, scope);
    } else if (expr.name === 'expr-siz') {
      let exprType = expr.kids[0].props.type;
      let size = evalSize(exprType);
      asm += line(`push    ${size}`);
    } else if (expr.name === 'expr-lit') {
      switch (expr.props.litType) {
        case 'dec-int':
          asm += line('push    ' + expr.props.value);
          break;
        case 'dec-boo':
          asm += line('push    ' + (expr.props.value === 'yes' ? 1 : 0));
          break;
        case 'ptr-str':
          let asmName = findAsmNameLitPtrStr(expr.props.value);
          asm += line('push    ' + asmName);
          break;
        default:
          throw makeImplErr('unknown literal type: ' + expr.props.litType);
      }
    } else if (expr.name === 'expr-op') {
      asm += compileExprOp(expr, scope);
    } else if (expr.name === 'expr-sym') {
      asm += compileExprSym(expr, scope);
    } else if (expr.name === 'expr-arr') {
      asm += compileExprArr(expr, scope);
    } else if (expr.name === 'expr-ctr') {
      asm += compileExprCtr(expr, scope);
    } else if (expr.name === 'expr-ref') {
      asm += compileExprRef(expr, scope);
    } else if (expr.name === 'expr-brackets') {
      asm += compileExpr(expr.kids[0], scope);
    } else if (expr.name === 'expr-drf') {
      asm += compileExprDrf(expr, scope);
    } else if (expr.name === 'expr-member') {
      asm += compileExprMember(expr, scope);
    } else {
      throw makeImplErr('unknown expression ' + expr.name);
    }
    return asm;
  }

  function compileExprReinterpret(expr, scope) {
    let wantedType = expr.kids[0];
    let kid = expr.kids[1];
    let actualType = evalType(kid, scope);

    let r = '';
    r += compileExpr(kid, scope);
    return r;
  }

  function compileExprDrf(expr, scope) {
    // note: this is already checked to be a pointer
    let kidExpr = expr.kids[0].kids[0]; // exprDrf.expr.kids[0]
    let r = '';
    r += compileExpr(kidExpr, scope);
    r += line(`pop     eax`);
    r += line(`mov     eax, [eax]`);
    r += line(`push    eax`);
    return r;
  }

  function compileExprMember(expr, scope) {
    let r = '';

    let chain = resolveMemberChain(scope, expr);
    let structExpr = chain.baseExpr;
    let member = chain.members[0];
    let memberSizeBytes = evalSize(member.type);
    let memberChainString = chain.members.map((x) => x.name).join('.');

    if (structExpr.name === 'expr-drf') {
      let addressExpr = structExpr.kids[0];

      r += line(`; expression member ref: ${memberChainString}`);
      r += compileExpr(addressExpr, scope);
      r += line('pop     ecx');

      let off = chain.off;
      r += compilePush('ecx', off, memberSizeBytes);
    } else if (structExpr.name === 'expr-sym') {
      let loc = findSymTableLoc(scope, structExpr.props.symbol);
      if (!loc) throw makeErr(expr.i, 'can not find symbol ' + symbol);
      let row = loc.row;
      let symRes = resolveSymbolBase(loc);
      r += symRes.asm;

      let off = row.off + chain.off;

      // r += line(`mov     eax, [${symRes.register}${getOffStr(off)}] ; member sym: ${structExpr.props.symbol}.(${memberChainString})`);
      // r += line(`push    eax`);
      r += line(`; expression sym member: ${structExpr.props.symbol}.${memberChainString}`);
      r += compilePush(symRes.register, off, memberSizeBytes);
    } else {
      throw makeImplErr('cannot access struct member of expression ' + structExpr.name);
    }

    return r;
  }

  // does not clobber any register
  function compilePush(register, offset, sizeBytes) {
    if (sizeBytes % 4 !== 0) throw makeImplErr('cannot push unaligned bytes');
    let r = '';
    let sizeStack = sizeBytes / 4;
    for (let i = 0; i < sizeStack; i++) {
      r += line(`push dword [${register}${getOffStr(offset + i * 4)}]`);
    }
    return r;
  }

  function makeMemberChain(baseExpr, off, members) {
    return { baseExpr, off, members };
  }

  function resolveMemberChain(scope, exprMember, members = []) {
    let memberName = exprMember.props.name;
    let structExpr = exprMember.kids[0];

    let structType = evalType(structExpr, scope);
    let structName = structType.name;
    let structRow = findStructTableRow(structName);
    if (!structRow) throw makeErr(expr.i, 'could not find struct ' + structName);
    let member = structRow.members.find((x) => x.name === memberName);
    if (!member) throw makeErr(expr.i, 'could not find member ' + memberName + ' of ' + structName);

    members.push(member);

    if (structExpr.name === 'expr-member') {
      return resolveMemberChain(scope, structExpr, members);
    }

    return makeMemberChain(
      structExpr,
      members.map((x) => x.off).reduce((a, b) => a + b),
      members
    );
  }

  function compileExprRef(expr, scope) {
    let kidExpr = expr.kids[0].kids[0];
    let asm = '';
    if (kidExpr.name === 'expr-sym') {
      return compileExprRefSym(kidExpr, scope);
    } else if (kidExpr.name === 'expr-member') {
      return compileExprRefMem(kidExpr, scope);
    } else {
      throw makeErr(kidExpr.i, 'can not take reference of expression ' + kidExpr.name);
    }
    return asm;
  }

  function compileExprRefMem(expr, scope) {
    let r = '';

    let chain = resolveMemberChain(scope, expr);
    let base = chain.baseExpr;
    let memberChainString = chain.members.map((x) => x.name).join('.');

    if (base.name === 'expr-sym') {
      let symbol = base.props.symbol;
      let loc = findSymTableLoc(scope, symbol);
      if (!loc) throw makeErr(expr.i, 'can not find symbol ' + symbol);
      let symRow = loc.row;
      let symRes = resolveSymbolBase(loc);
      r += symRes.asm;

      let off = symRow.off + chain.off;
      r += line(`lea     eax, [${symRes.register}${getOffStr(off)}] ; member address: ${symbol}.${memberChainString}`);
      r += line(`push    eax`);
    } else if (base.name === 'expr-drf') {
      let addressExpr = base.kids[0];

      r += line(`; expression member ref: ${memberChainString}`);
      r += compileExpr(addressExpr, scope);

      let off = chain.off;
      r += line('add     dword [esp], ' + off);
    } else {
      throw makeErr(kidExpr.i, 'can not take member reference of expression ' + base.name);
    }

    return r;
  }

  function compileExprRefSym(exprSym, scope) {
    let asm = '';
    let symbol = exprSym.props.symbol;
    let loc = findSymTableLoc(scope, symbol);
    if (!loc) throw makeErr(exprSym.i, 'can not find symbol ' + symbol);
    let row = loc.row;
    let symRes = resolveSymbolBase(loc);
    asm += symRes.asm;
    asm += line(`lea     eax, [${symRes.register}${getOffStr(row.off)}] ; symbol ref: ${symbol}`);
    asm += line(`push    eax`);
    return asm;
  }

  function compileExprCtr(expr, scope) {
    let r = '';

    r += line('; ctr ' + expr.props.name);

    let structRow = findStructTableRow(expr.props.name);
    if (!structRow) throw makeErr(expr.i, 'unknown struct: ' + expr.props.name);

    let inits = expr.kids.filter((x) => x.name === 'member-init');

    if (structRow.members < inits.length) throw makeErr(expr.i, 'to many member initializations for ' + structRow.name);

    for (const member of structRow.members) {
      let init = inits.find((x) => x.props.name == member.name);
      if (!init) throw makeErr(expr.i, 'can not find initialization for member ' + member.name);

      let expr = init.kids.find((x) => x.name === 'expr');
      let type = member.type;

      checkType(expr, scope, type);

      r += compileExpr(expr, scope);
    }

    r += line();

    return r;
  }

  function compileExprArr(expr, scope) {
    let asm = '';

    let type = expr.kids[0].props.type;
    let sizeExpr = expr.kids[1];

    let sizeType = typeToString(evalType(sizeExpr, scope));
    if (sizeType !== 'ptr' && sizeType !== 'int32') throw makeErr(sizeExpr.i, 'expected expression of type ptr or int32');

    // NOTE: ARRAY EXPRESSIONS DIE AFTER GOING OUT OF SCOPE.

    let typeSize = evalSize(type);
    if (typeSize % 4 !== 0) throw makeImplErr();

    asm += compileExpr(sizeExpr, scope);
    asm += line(`pop     eax`);
    asm += line(`mov     ebx, ${typeSize}`);
    asm += line(`mul     ebx`);

    // push array, push array pointer
    asm += line(`sub     esp, eax`);
    asm += line(`push    esp ; array base`);

    return asm;
  }

  function compileExprOp(exprOp, scope) {
    let op = exprOp.props.op;
    switch (op) {
      case '==':
        return compileExprOpComp(exprOp, scope, 'sete');
      case '!=':
        return compileExprOpComp(exprOp, scope, 'setne');
      case '>':
        return compileExprOpComp(exprOp, scope, 'setg');
      case '<':
        return compileExprOpComp(exprOp, scope, 'setl');
      case '>=':
        return compileExprOpComp(exprOp, scope, 'setge');
      case '<=':
        return compileExprOpComp(exprOp, scope, 'setle');
      case '-':
        return compileExprOpSimple(exprOp, scope, op, 'sub');
      case '+':
        return compileExprOpSimple(exprOp, scope, op, 'add');
      case '*':
        return compileExprOpMul(exprOp, scope, op, 'imul');
      case '/':
        return compileExprOpSimple(exprOp, scope, op, 'idiv');
      case '||':
        return compileExprOpSimple(exprOp, scope, op, 'or');
      case '&&':
        return compileExprOpSimple(exprOp, scope, op, 'and');
      default:
        throw makeImplErr('unknown operand ' + op);
    }
  }

  function compileExprOpComp(exprOp, scope, inst) {
    let a = exprOp.kids[0];
    let b = exprOp.kids[1];
    let asm = '';
    asm += compileExpr(a, scope);
    asm += compileExpr(b, scope);
    // comparing: https://stackoverflow.com/questions/77062912/how-to-move-the-zero-flag-into-a-register-in-x86-64
    // setz:      https://browncs1260.github.io/misc/assembly#directive-reference
    asm += line(`xor     eax, eax`);
    asm += line(`pop     edx`);
    asm += line(`pop     ecx`);
    asm += line(`cmp     ecx, edx`);
    asm += line(`${inst.padEnd(8, ' ')}al`);
    asm += line(`push    eax`);

    return asm;
  }

  // (very inefficient lol)
  function compileExprOpSimple(exprOp, scope, op, asmOp) {
    if (exprOp.kids.length != 2) throw makeErr('expected 2 params for op ' + op);
    let a = exprOp.kids[0];
    let b = exprOp.kids[1];
    let asm = '';
    asm += compileExpr(a, scope);
    asm += compileExpr(b, scope);
    asm += line(`pop     eax`);
    asm += line(`${asmOp.padEnd(8, ' ')}[esp], eax`);
    return asm;
  }

  function compileExprOpMul(exprOp, scope, op, asmOp) {
    if (exprOp.kids.length != 2) throw makeErr('expected 2 params for op ' + op);
    let a = exprOp.kids[0];
    let b = exprOp.kids[1];
    let asm = '';
    asm += compileExpr(a, scope);
    asm += compileExpr(b, scope);
    asm += line(`pop     eax`);
    asm += line(`pop     ebx`);
    asm += line(`${asmOp.padEnd(8, ' ')} eax, ebx`);
    asm += line(`push    eax`);
    return asm;
  }

  function compileExprSym(exprSym, scope) {
    let asm = '';

    let symbol = exprSym.props.symbol;

    let loc = findSymTableLoc(scope, symbol);
    if (!loc) throw makeErr(exprSym.i, 'can not find symbol ' + symbol);
    let row = loc.row;
    let type = row.type;

    let symRes = resolveSymbolBase(loc);

    asm += symRes.asm;

    if (type.kind === 'prim') {
      asm += line(`mov     eax, [${symRes.register}${getOffStr(row.off)}] ; expr symbol: ${symbol}`);
      asm += line(`push    eax`);
    } else if (type.name === 'struct') {
      let structRow = findStructTableRow(type.name);
      if (!structRow) throw new makeErr(exprSym.i, 'struct ' + type.name + ' not found');
      if (structRow.size % 4 !== 0) throw makeImplErr('struct needs to be 4-byte aligned');

      asm += line(`; expr struct ${structRow.name} symbol: ${symbol} {`);
      let size = structRow.size / 4;
      for (let i = 0; i < size; i++) {
        // asm += line(`mov     eax, [${symRes.register}${getOffStr(row.off + i * 4)}]`);
        // asm += line(`push    eax`);
        asm += line(`push    dword [${symRes.register}${getOffStr(row.off + i * 4)}]`);
      }
      asm += line('; }');
    } else {
      _ass(false);
    }

    return asm;
  }

  // /

  // compilation start ========================================
  baseCompileStructTable();
  let dataDefinitions = baseCompileDataTable();
  let resultTopLevel = baseCompileMain();
  let resultFunctions = baseCompileFunctions();

  //

  function baseCompileFunctions() {
    let r = '';
    for (const code of state.root.kids) {
      if (code.name !== 'code') continue;

      for (const kid of code.kids.filter((x) => x.name === 'func')) {
        r += compileFunc(kid);
      }
    }
    return r;
  }

  if (dataDefinitions.length === 0 && resultTopLevel.length === 0 && resultFunctions.length === 0) return '';

  let program = '';

  let eol = '\n';

  program += '; data definitions' + eol;
  program += 'section .text' + eol;
  program += dataDefinitions + eol;

  program += '; code' + eol;
  program += 'section .text' + eol;
  if (state.isMain) {
    program += 'global _main' + eol;
    program += '_main:' + eol;
    program += resultTopLevel;
  }

  program += resultFunctions;

  // TODO: move into lib.
  // extern  _ExitProcess@4
  // push    0
  // call    _ExitProcess@4
  // hlt

  return program;
}

//
// ============================== UTILS            ==============================
//

function lineNumber(str, idx) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < str.length && i <= idx; i++) {
    const c = str[i];
    if (c == '\n') {
      line++;
      col = 1;
      continue;
    }
    col++;
  }
  return { line, col };
}

// type start ================================================================= {

function makeTypePrim(name, args = []) {
  return { kind: 'prim', name, args };
}

function makeTypeStruct(name, args = []) {
  return { kind: 'struct', name, args };
}

function typeEquals(a, b) {
  _ass(a);
  _ass(b);
  return typeToString(a) === typeToString(b);
}

function typeBaseName(type) {
  _ass(type.kind);
  return type.name;
}

function typeToString(type) {
  if (!type.kind) throw 0;
  switch (type.kind) {
    case 'prim':
      return type.name + (type.args > 0 ? '[' + args.join(', ') + ']' : '');
    case 'struct':
      return type.name;
    default:
      throw 0;
  }
}

// type end   }

// ctx start  ================================================================= {

function makeFuncSig(name) {
  return { name };
}

function makeContext() {
  return { funcSigs: [], unitPaths: [] };
}

export function doMakeContext() {
  return makeContext();
}

export function addToContext(ctx, path, src) {
  ctx.unitPaths.push(path);
}

export function validateContext(ctx) {}

// ctx end    }

export function doParse(ctx, path, src) {
  return parseFile(path, src);
}

export function doCompile(ctx, path, src, isMain, tree) {
  let state = makeCompileState(ctx, path, src, isMain, tree, tree);
  return compile(state);
}