
global _main

; data definitions
section .text
;   str at in-code.sus:5:28
ss_1:
  db 'expected6', 10, 0
;   str at in-code.sus:11:27
ss_2:
  db 'FAILED', 10, 0
;   str at in-code.sus:13:28
ss_3:
  db 'expected1', 10, 0
;   str at in-code.sus:18:30
ss_4:
  db 'expected2', 10, 0
;   str at in-code.sus:28:32
ss_5:
  db 'expected3', 10, 0
;   str at in-code.sus:35:30
ss_6:
  db 'expected4', 10, 0
;   str at in-code.sus:37:28
ss_7:
  db 'expected5', 10, 0
;   str at in-code.sus:64:21
ss_8:
  db 10, 0

; code
section .text

_main:
  ;   tls at in-code.sus:2:4   ================= {
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  call    sf_test1@

  ; call
  call    sf_test2@

  ; call
  call    sf_test3@

  ; call
  push    ss_1
  call    sf_print@s
  add     esp, 4

st__tls_2_4_end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ; } tls at in-code.sus:2:4                     


  extern  _ExitProcess@4
  push    0
  call    _ExitProcess@4

  hlt

;   func at in-code.sus:8:12   ================ {
sf_test1@:
  push    ebp
  lea     ebp, [esp - 4]

  ;   bloc at in-code.sus:10:6   ================ {
    push    ebp
    lea     ebp, [esp - 4]

    jmp     ss__bloc_10_6_end
    ; call
    push    ss_2
    call    sf_print@s
    add     esp, 4

  ss__bloc_10_6_end:
    lea     esp, [ebp + 8]
    mov     ebp, [ebp + 4]
; } bloc at in-code.sus:10:6                    
  ; call
  push    ss_3
  call    sf_print@s
  add     esp, 4

sf_test1@@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:8:12                    

;   func at in-code.sus:16:12   =============== {
sf_test2@:
  push    ebp
  lea     ebp, [esp - 4]

  ;   bloc at in-code.sus:18:6   ================ {
    push    ebp
    lea     ebp, [esp - 4]

    ; call
    push    ss_4
    call    sf_print@s
    add     esp, 4

    lea     esp, [ebp + 8]
    mov     ebp, [ebp + 4]
    jmp     sf_test2@@end
    ; call
    push    ss_2
    call    sf_print@s
    add     esp, 4

  ss__bloc_18_6_end:
    lea     esp, [ebp + 8]
    mov     ebp, [ebp + 4]
; } bloc at in-code.sus:18:6                    
  ; call
  push    ss_2
  call    sf_print@s
  add     esp, 4

sf_test2@@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:16:12                   

;   func at in-code.sus:25:12   =============== {
sf_test3@:
  push    ebp
  lea     ebp, [esp - 4]

  ;   bloc at in-code.sus:27:6   ================ {
    push    ebp
    lea     ebp, [esp - 4]

    ;   bloc at in-code.sus:28:8   ================ {
      push    ebp
      lea     ebp, [esp - 4]

      ; call
      push    ss_5
      call    sf_print@s
      add     esp, 4

      ;   bloc at in-code.sus:30:10   =============== {
        push    ebp
        lea     ebp, [esp - 4]

        lea     esp, [ebp + 8]
        mov     ebp, [ebp + 4]
        jmp     ss__bloc_28_8_end
        ; call
        push    ss_2
        call    sf_print@s
        add     esp, 4

      ss__bloc_30_10_end:
        lea     esp, [ebp + 8]
        mov     ebp, [ebp + 4]
    ; } bloc at in-code.sus:30:10                   
      ; call
      push    ss_2
      call    sf_print@s
      add     esp, 4

    ss__bloc_28_8_end:
      lea     esp, [ebp + 8]
      mov     ebp, [ebp + 4]
  ; } bloc at in-code.sus:28:8                    
    ; call
    push    ss_6
    call    sf_print@s
    add     esp, 4

  ss__bloc_27_6_end:
    lea     esp, [ebp + 8]
    mov     ebp, [ebp + 4]
; } bloc at in-code.sus:27:6                    
  ; call
  push    ss_7
  call    sf_print@s
  add     esp, 4

sf_test3@@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:25:12                   

;   func at in-code.sus:44:12   =============== {
sf_print@b:
  push    ebp
  lea     ebp, [esp - 4]

  mov     eax, [ebp + 12] ; symbol: b
  push    eax
  pop     eax
  cmp     eax, 1
  jne     ss__if_45_8_else
  ss__if_45_8_yes:
    ; call
    push    1
    call    sf_sus_out_int32@integer
    add     esp, 4

    jmp     ss__if_45_8_end
  ss__if_45_8_else:
    ; call
    push    0
    call    sf_sus_out_int32@integer
    add     esp, 4

  ss__if_45_8_end:

sf_print@b@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:44:12                   

;   func at in-code.sus:49:12   =============== {
sf_print@i:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  mov     eax, [ebp + 12] ; symbol: i
  push    eax
  call    sf_sus_out_int32@integer
  add     esp, 4

sf_print@i@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:49:12                   

;   func at in-code.sus:53:12   =============== {
sf_print@s:
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
  call    sf_sus_length@buffer#length#size
  add     esp, 12

  ; call
  mov     eax, [ebp] ; symbol: length
  push    eax
  mov     eax, [ebp + 12] ; symbol: s
  push    eax
  call    sf_sus_out_buffer@buffer#size
  add     esp, 8

sf_print@s@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:53:12                   

;   func at in-code.sus:63:14   =============== {
sf_printLn@:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  push    ss_8
  call    sf_print@s
  add     esp, 4

sf_printLn@@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:63:14                   

;   func at in-code.sus:88:20   =============== {
sf_sus_out_int32@integer:
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
  call    sf_sus_iota_s@buffer#radix#size#value
  add     esp, 16

  ; call
  lea     eax, [ebp - 8] ; symbol ref: length
  push    eax
  mov     eax, [ebp] ; symbol: bufferSize
  push    eax
  mov     eax, [ebp - 4] ; symbol: intBuffer
  push    eax
  call    sf_sus_length@buffer#length#size
  add     esp, 12

  ; call
  mov     eax, [ebp - 8] ; symbol: length
  push    eax
  mov     eax, [ebp - 4] ; symbol: intBuffer
  push    eax
  call    sf_sus_out_buffer@buffer#size
  add     esp, 8

sf_sus_out_int32@integer@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:88:20                   

;   func at in-code.sus:108:19   ============== {
sf_sus_out_line@:
  push    ebp
  lea     ebp, [esp - 4]

  ; call
  push    1
  push    ss_8
  call    sf_sus_out_buffer@buffer#size
  add     esp, 8

sf_sus_out_line@@end:
  lea     esp, [ebp + 8]
  mov     ebp, [ebp + 4]
  ret
; } func at in-code.sus:108:19                  

;   func at in-code.sus:112:15   ============== {
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
; } func at in-code.sus:112:15                  

;   func at in-code.sus:122:17   ============== {
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
; } func at in-code.sus:122:17                  

;   func at in-code.sus:135:17   ============== {
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
; } func at in-code.sus:135:17                  

;   func at in-code.sus:150:21   ============== {
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
; } func at in-code.sus:150:21                  

