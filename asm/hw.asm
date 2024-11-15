
global _main

; data definitions
section .text
;   str at in-code.sus:20:21
ss_1:
  db ', ', 0
;   str at in-code.sus:22:23
ss_2:
  db '    ', 0
;   str at in-code.sus:29:26
ss_3:
  db 'equal', 0
;   str at in-code.sus:35:30
ss_4:
  db 'not equal', 0
;   str at in-code.sus:44:24
ss_5:
  db '     ', 0
;   str at in-code.sus:51:36
ss_6:
  db '        FAILURE', 0
;   str at in-code.sus:77:22
ss_7:
  db 10, 0

; code
section .text

_main:
  ;   tls at in-code.sus:2:4   ================= {
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 4

  ; call
  push    0
  push    0
  pop     eax
  or      [esp], eax
  call    sf_pr@int@B
  add     esp, 4

  ; call
  push    1
  push    0
  pop     eax
  or      [esp], eax
  call    sf_pr@int@B
  add     esp, 4

  ; call
  push    1
  push    1
  pop     eax
  or      [esp], eax
  call    sf_pr@int@B
  add     esp, 4

  ; call
  push    0
  push    1
  pop     eax
  or      [esp], eax
  call    sf_pr@int@B
  add     esp, 4

  ; call
  call    sf_printLn

  ; symbol init: result
  push    1
  pop     eax
  mov     [ebp], eax

  ; call
  push    1
  lea     eax, [ebp] ; symbol ref: result
  push    eax
  push    0
  push    0
  call    sf_testIfEquals
  add     esp, 16

  ; call
  push    1
  lea     eax, [ebp] ; symbol ref: result
  push    eax
  push    10
  push    10
  call    sf_testIfEquals
  add     esp, 16

  ; call
  push    0
  lea     eax, [ebp] ; symbol ref: result
  push    eax
  push    0
  push    10
  call    sf_testIfEquals
  add     esp, 16

  ; call
  push    0
  lea     eax, [ebp] ; symbol ref: result
  push    eax
  push    10
  push    0
  call    sf_testIfEquals
  add     esp, 16

  ; call
  push    0
  lea     eax, [ebp] ; symbol ref: result
  push    eax
  push    0
  push    0
  call    sf_testIfEquals
  add     esp, 16

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ; } tls at in-code.sus:2:4                     


  extern  _ExitProcess@4
  push    0
  call    _ExitProcess@4

  hlt

;   func at in-code.sus:18:19   =============== {
sf_testIfEquals:
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 12

  ; call
  mov     eax, [ebp + 12] ; symbol: a
  push    eax
  call    sf_printI
  add     esp, 4

  ; call
  push    ss_1
  call    sf_printS
  add     esp, 4

  ; call
  mov     eax, [ebp + 16] ; symbol: b
  push    eax
  call    sf_printI
  add     esp, 4

  ; call
  push    ss_2
  call    sf_printS
  add     esp, 4

  ; symbol init: t
  mov     eax, [ebp + 12] ; symbol: a
  push    eax
  mov     eax, [ebp + 16] ; symbol: b
  push    eax
  xor     eax, eax
  pop     ecx
  pop     edx
  cmp     ecx, edx
  sete    al
  push    eax
  pop     eax
  mov     [ebp], eax

  ; symbol init: r
  push    0
  pop     eax
  mov     [ebp - 4], eax

  ; symbol init: pt
  push    1
  pop     eax
  mov     ecx, 1
  mul     ecx
  add     eax, 3
  shr     eax, 2
  shl     eax, 2
  sub     esp, eax
  push    esp ; array base
  pop     eax
  mov     [ebp - 8], eax

  mov     eax, [ebp] ; symbol: t
  push    eax
  pop     eax
  cmp     eax, 1
  jne     ss__if_28_8_else
  ss__if_28_8_yes:
    ;   bloc at in-code.sus:29:6   ================ {
      push    ebp
      lea     ebp, [esp - 4]

      ; call
      push    ss_3
      call    sf_printS
      add     esp, 4

      ; symbol assign: r
      push    1
      mov     edx, [ebp + 4]
      pop     eax
      mov     [edx - 4], eax

      ; deref assign
      mov     edx, [ebp + 4]
      mov     eax, [edx - 8] ; symbol: pt
      push    eax
      mov     edx, [ebp + 4]
      mov     eax, [edx - 4] ; symbol: r
      push    eax
      pop     eax
      pop     ecx
      mov     [ecx], eax

      ; call
      mov     edx, [ebp + 4]
      mov     eax, [edx - 8] ; symbol: pt
      push    eax
      pop     eax
      mov     eax, [eax]
      push    eax
      call    sf_pr@int@B
      add     esp, 4

      lea     esp, [ebp + 8]
      mov     ebp, [ebp + 4]
  ; } bloc at in-code.sus:29:6                    
    jmp     ss__if_28_8_end
  ss__if_28_8_else:
    ;   bloc at in-code.sus:35:6   ================ {
      push    ebp
      lea     ebp, [esp - 4]

      ; call
      push    ss_4
      call    sf_printS
      add     esp, 4

      ; symbol assign: r
      push    0
      mov     edx, [ebp + 4]
      pop     eax
      mov     [edx - 4], eax

      ; deref assign
      mov     edx, [ebp + 4]
      mov     eax, [edx - 8] ; symbol: pt
      push    eax
      mov     edx, [ebp + 4]
      mov     eax, [edx - 4] ; symbol: r
      push    eax
      pop     eax
      pop     ecx
      mov     [ecx], eax

      ; call
      mov     edx, [ebp + 4]
      mov     eax, [edx - 8] ; symbol: pt
      push    eax
      pop     eax
      mov     eax, [eax]
      push    eax
      call    sf_pr@int@B
      add     esp, 4

      lea     esp, [ebp + 8]
      mov     ebp, [ebp + 4]
  ; } bloc at in-code.sus:35:6                    
  ss__if_28_8_end:

  ; deref assign
  mov     eax, [ebp + 20] ; symbol: result
  push    eax
  mov     eax, [ebp - 4] ; symbol: r
  push    eax
  pop     eax
  pop     ecx
  mov     [ecx], eax

  ; call
  push    ss_5
  call    sf_printS
  add     esp, 4

  ; call
  mov     eax, [ebp + 20] ; symbol: result
  push    eax
  pop     eax
  mov     eax, [eax]
  push    eax
  call    sf_pr@int@B
  add     esp, 4

  ; call
  mov     eax, [ebp - 4] ; symbol: r
  push    eax
  call    sf_pr@int@B
  add     esp, 4

  ; call
  mov     eax, [ebp + 24] ; symbol: expected
  push    eax
  call    sf_pr@int@B
  add     esp, 4

  ; call
  mov     eax, [ebp - 8] ; symbol: pt
  push    eax
  pop     eax
  mov     eax, [eax]
  push    eax
  call    sf_pr@int@B
  add     esp, 4

  mov     eax, [ebp + 20] ; symbol: result
  push    eax
  pop     eax
  mov     eax, [eax]
  push    eax
  mov     eax, [ebp + 24] ; symbol: expected
  push    eax
  xor     eax, eax
  pop     ecx
  pop     edx
  cmp     ecx, edx
  setne   al
  push    eax
  mov     eax, [ebp - 8] ; symbol: pt
  push    eax
  pop     eax
  mov     eax, [eax]
  push    eax
  pop     eax
  or      [esp], eax
  mov     eax, [ebp + 20] ; symbol: result
  push    eax
  pop     eax
  mov     eax, [eax]
  push    eax
  xor     eax, eax
  pop     ecx
  pop     edx
  cmp     ecx, edx
  setne   al
  push    eax
  pop     eax
  cmp     eax, 1
  jne     ss__if_50_8_end
  ss__if_50_8_yes:
    ; call
    push    ss_6
    call    sf_printS
    add     esp, 4

    jmp     ss__if_50_8_end
  ss__if_50_8_end:

  ; call
  call    sf_printLn

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:18:19                   

;   func at in-code.sus:57:13   =============== {
sf_pr@int@B:
  push    ebp
  lea     ebp, [esp - 4]

  mov     eax, [ebp + 12] ; symbol: b
  push    eax
  pop     eax
  cmp     eax, 1
  jne     ss__if_58_8_else
  ss__if_58_8_yes:
    ; call
    push    1
    call    sf_sus_out_int32
    add     esp, 4

    jmp     ss__if_58_8_end
  ss__if_58_8_else:
    ; call
    push    0
    call    sf_sus_out_int32
    add     esp, 4

  ss__if_58_8_end:

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:57:13                   

;   func at in-code.sus:62:13   =============== {
sf_printI:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  mov     eax, [ebp + 12] ; symbol: i
  push    eax
  call    sf_sus_out_int32
  add     esp, 4

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:62:13                   

;   func at in-code.sus:66:13   =============== {
sf_printS:
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 4

  ; symbol init: length
  push    0
  pop     eax
  mov     [ebp], eax

  ; call
  lea     eax, [ebp] ; symbol ref: length
  push    eax
  push    10000
  mov     eax, [ebp + 12] ; symbol: s
  push    eax
  call    sf_sus_length
  add     esp, 12

  ; call
  mov     eax, [ebp] ; symbol: length
  push    eax
  mov     eax, [ebp + 12] ; symbol: s
  push    eax
  call    sf_sus_out_buffer
  add     esp, 8

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:66:13                   

;   func at in-code.sus:76:14   =============== {
sf_printLn:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  push    ss_7
  call    sf_printS
  add     esp, 4

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:76:14                   

;   func at in-code.sus:101:20   ============== {
sf_sus_out_int32:
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 12

  ; symbol init: bufferSize
  push    128
  pop     eax
  mov     [ebp], eax

  ; symbol init: intBuffer
  mov     eax, [ebp] ; symbol: bufferSize
  push    eax
  pop     eax
  mov     ecx, 1
  mul     ecx
  add     eax, 3
  shr     eax, 2
  shl     eax, 2
  sub     esp, eax
  push    esp ; array base
  pop     eax
  mov     [ebp - 4], eax

  ; symbol init: length
  push    0
  pop     eax
  mov     [ebp - 8], eax

  ; call
  push    10
  mov     eax, [ebp] ; symbol: bufferSize
  push    eax
  mov     eax, [ebp - 4] ; symbol: intBuffer
  push    eax
  mov     eax, [ebp + 12] ; symbol: integer
  push    eax
  call    sf_sus_iota_s
  add     esp, 16

  ; call
  lea     eax, [ebp - 8] ; symbol ref: length
  push    eax
  mov     eax, [ebp] ; symbol: bufferSize
  push    eax
  mov     eax, [ebp - 4] ; symbol: intBuffer
  push    eax
  call    sf_sus_length
  add     esp, 12

  ; call
  mov     eax, [ebp - 8] ; symbol: length
  push    eax
  mov     eax, [ebp - 4] ; symbol: intBuffer
  push    eax
  call    sf_sus_out_buffer
  add     esp, 8

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:101:20                  

;   func at in-code.sus:121:19   ============== {
sf_sus_out_line:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  push    1
  push    ss_7
  call    sf_sus_out_buffer
  add     esp, 8

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:121:19                  

;   func at in-code.sus:125:15   ============== {
sf_sus_exit:
  push    ebp
  lea     ebp, [esp - 4]

  ; asm
  extern  _ExitProcess@4
  mov     eax, [ebp + 12]
  push    eax
  call    _ExitProcess@4
  hlt

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:125:15                  

;   func at in-code.sus:135:17   ============== {
sf_sus_length:
  push    ebp
  lea     ebp, [esp - 4]

  ; asm
  extern  _strnlen
  mov     eax, [ebp + 16]
  push    eax
  mov     eax, [ebp + 12]
  push    eax
  call    _strnlen
  mov     ecx, [ebp + 20]
  mov     [ecx], eax

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:135:17                  

;   func at in-code.sus:148:17   ============== {
sf_sus_iota_s:
  push    ebp
  lea     ebp, [esp - 4]

  ; asm
  extern  __itoa_s
  mov     eax, [ebp + 24]
  push    eax
  mov     eax, [ebp + 20]
  push    eax
  mov     eax, [ebp + 16]
  push    eax
  mov     eax, [ebp + 12]
  push    eax
  call    __itoa_s

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:148:17                  

;   func at in-code.sus:163:21   ============== {
sf_sus_out_buffer:
  push    ebp
  lea     ebp, [esp - 4]

  ; asm
  extern  _GetStdHandle@4
  extern  _WriteFile@20
  push    -11
  call    _GetStdHandle@4
  mov     ecx, eax    
  push    0
  push    0
  mov     eax, [ebp + 16]
  push    eax
  mov     eax, [ebp + 12]
  push    eax
  push    ecx
  call    _WriteFile@20

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:163:21                  

