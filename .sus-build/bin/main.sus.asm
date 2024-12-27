; data definitions
section .text
;   str at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:5:42
ss_1:
  db 'Hello, World', 33, 10, 0
;   str at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:9:26
ss_2:
  db 'test', 10, 0
;   str at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:58:23
ss_3:
  db 10, 0

; code
section .text
global _main
_main:
  ;   main block at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:5:6    {
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 8

  ; symbol init: str
  push    ss_1
  mov     eax, [esp]
  mov     [ebp], eax
  add     esp, 4

  ; symbol init: len
  push    14
  mov     eax, [esp]
  mov     [ebp - 4], eax
  add     esp, 4

  ; call
  mov     eax, [ebp - 4] ; expr symbol: len
  push    eax
  mov     eax, [ebp] ; expr symbol: str
  push    eax
  call    sf_out@buffer#size
  add     esp, 8

  ; call
  push    ss_2
  call    sf_print@s
  add     esp, 4

st__tls_5_6_end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ; } main block at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:5:6 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:13:12    {
sf_out@buffer#size:
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
  mov     eax, [ebp + 16]; inserts [ebp+SIZE OFFSET]
  push    eax
  mov     eax, [ebp + 12]
  push    eax
  push    ecx
  call    _WriteFile@20

sf_out@buffer#size@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:13:12 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:38:14    {
sf_print@b:
  push    ebp
  lea     ebp, [esp - 4]

  mov     eax, [ebp + 12] ; expr symbol: b
  push    eax
  pop     eax
  cmp     eax, 1
  jne     ss__if_39_10_else
  ss__if_39_10_yes:
    ; call
    push    1
    call    sf_sus_out_int32@integer
    add     esp, 4

    jmp     ss__if_39_10_end
  ss__if_39_10_else:
    ; call
    push    0
    call    sf_sus_out_int32@integer
    add     esp, 4

  ss__if_39_10_end:

sf_print@b@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:38:14 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:43:14    {
sf_print@i:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  mov     eax, [ebp + 12] ; expr symbol: i
  push    eax
  call    sf_sus_out_int32@integer
  add     esp, 4

sf_print@i@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:43:14 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:47:14    {
sf_print@s:
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 4

  ; symbol init: length
  push    0
  mov     eax, [esp]
  mov     [ebp], eax
  add     esp, 4

  ; call
  lea     eax, [ebp] ; symbol ref: length
  push    eax
  push    10000
  mov     eax, [ebp + 12] ; expr symbol: s
  push    eax
  call    sf_sus_length@buffer#length#size
  add     esp, 12

  ; call
  mov     eax, [ebp] ; expr symbol: length
  push    eax
  mov     eax, [ebp + 12] ; expr symbol: s
  push    eax
  call    sf_sus_out_buffer@buffer#size
  add     esp, 8

sf_print@s@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:47:14 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:57:16    {
sf_printLn@:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  push    ss_3
  call    sf_print@s
  add     esp, 4

sf_printLn@@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:57:16 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:65:22    {
sf_sus_out_int32@integer:
  push    ebp
  lea     ebp, [esp - 4]
  sub     esp, 12

  ; symbol init: bufferSize
  push    128
  mov     eax, [esp]
  mov     [ebp], eax
  add     esp, 4

  ; symbol init: intBuffer
  mov     eax, [ebp] ; expr symbol: bufferSize
  push    eax
  pop     eax
  mov     ebx, 4
  mul     ebx
  sub     esp, eax
  push    esp ; array base
  mov     eax, [esp]
  mov     [ebp - 4], eax
  add     esp, 4

  ; symbol init: length
  push    0
  mov     eax, [esp]
  mov     [ebp - 8], eax
  add     esp, 4

  ; call
  push    10
  mov     eax, [ebp] ; expr symbol: bufferSize
  push    eax
  mov     eax, [ebp - 4] ; expr symbol: intBuffer
  push    eax
  mov     eax, [ebp + 12] ; expr symbol: integer
  push    eax
  call    sf_sus_iota_s@buffer#radix#size#value
  add     esp, 16

  ; call
  lea     eax, [ebp - 8] ; symbol ref: length
  push    eax
  mov     eax, [ebp] ; expr symbol: bufferSize
  push    eax
  mov     eax, [ebp - 4] ; expr symbol: intBuffer
  push    eax
  call    sf_sus_length@buffer#length#size
  add     esp, 12

  ; call
  mov     eax, [ebp - 8] ; expr symbol: length
  push    eax
  mov     eax, [ebp - 4] ; expr symbol: intBuffer
  push    eax
  call    sf_sus_out_buffer@buffer#size
  add     esp, 8

sf_sus_out_int32@integer@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:65:22 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:85:21    {
sf_sus_out_line@:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  push    1
  push    ss_3
  call    sf_sus_out_buffer@buffer#size
  add     esp, 8

sf_sus_out_line@@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:85:21 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:89:17    {
sf_sus_exit@code:
  push    ebp
  lea     ebp, [esp - 4]

  ; asm
  extern  _ExitProcess@4
  mov     eax, [ebp + 12]
  push    eax
  call    _ExitProcess@4
  hlt

sf_sus_exit@code@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:89:17 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:99:19    {
sf_sus_length@buffer#length#size:
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

sf_sus_length@buffer#length#size@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:99:19 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:112:19    {
sf_sus_iota_s@buffer#radix#size#value:
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

sf_sus_iota_s@buffer#radix#size#value@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:112:19 

;   func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:127:23    {
sf_sus_out_buffer@buffer#size:
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

sf_sus_out_buffer@buffer#size@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at I:\Fun\sus.exe\test-sus\8-node-sections\main.sus:127:23 

