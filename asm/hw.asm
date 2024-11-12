
global _main

; data definitions
section .text
;   str at in-code.sus:3:39
ss_1:
  db 'Hallo', 10, 0
;   str at in-code.sus:60:34
ss_2:
  db 10, 0

; code
section .text

_main:
  ;   tls at in-code.sus:3:4   ================= {
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 4

  ; call
  push    6
  push    ss_1
  call    sf_sus_out_buffer
  add     esp, 8

  ; symbol init: test
  push    -123
  pop     eax
  mov     [ebp], eax

  ; call
  mov     eax, [ebp] ; symbol: test
  push    eax
  call    sf_sus_out_int32
  add     esp, 4

  ; call
  call    sf_sus_out_line

  ; call
  mov     eax, [ebp] ; symbol: test
  push    eax
  call    sf_sus_out_int32
  add     esp, 4

  ; call
  call    sf_sus_out_line

  ; call
  mov     eax, [ebp] ; symbol: test
  push    eax
  call    sf_sus_out_int32
  add     esp, 4

  ; call
  call    sf_sus_out_line

  ; call
  push    0
  call    sf_sus_exit
  add     esp, 4

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ; } tls at in-code.sus:3:4                     


  extern  _ExitProcess@4
  push    0
  call    _ExitProcess@4

  hlt

;   func at in-code.sus:39:20   =============== {
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
; } func at in-code.sus:39:20                   

;   func at in-code.sus:59:19   =============== {
sf_sus_out_line:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  push    1
  push    ss_2
  call    sf_sus_out_buffer
  add     esp, 8

  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:59:19                   

;   func at in-code.sus:63:15   =============== {
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
; } func at in-code.sus:63:15                   

;   func at in-code.sus:73:17   =============== {
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
; } func at in-code.sus:73:17                   

;   func at in-code.sus:86:17   =============== {
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
; } func at in-code.sus:86:17                   

;   func at in-code.sus:101:21   ============== {
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
; } func at in-code.sus:101:21                  

