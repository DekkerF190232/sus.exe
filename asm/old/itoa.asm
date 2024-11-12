global _main

extern  _GetStdHandle@4
extern  _WriteFile@20
extern  __itoa_s
extern  _strnlen

extern  _ExitProcess@4

section .data

    message:
        db      'Hello, World', 10
    message_end:

; Assembly section
section .text

    _main:

        ; print_message
        push    message
        push    (message_end - message)
        call    print_message
        pop     eax
        pop     eax
        ; /

        ; char[128] buffer;
        sub     esp, 128

        ; __stdcall errno_t _itoa_s( int value, char * buffer, size_t size, int radix );
        push    10

        push    128

        lea     eax, [esp + 8]
        push    eax

        push    -1234
        
        call    __itoa_s

;   NOTE: THIS IS FUCKING INVALID DONT DO THIS WHY DID THIS WORK????
        pop     eax
        pop     eax
        pop     eax
        pop     eax

        ; /

        ; __stdcall size_t strnlen_s(
        ;    const char *str,
        ;    size_t numberOfElements
        ; );

        push    128

        lea     eax, [esp + 4]
        push    eax

        call    _strnlen
        
        mov     ecx, eax
        pop     eax
        pop     eax

        ; /

        ; print_message
        
        lea     eax, [esp]
        push    eax

        push    ecx

        call    print_message
        pop     eax
        pop     eax
        ; /


        push    0
        call    _ExitProcess@4

        hlt
    
    ; - params (ltr):
    ;     [byte] message
    ;     int32 size
    ; - stack is cleaned up by callee.
    ; - preserved registers: ebx, esi, edi, ebp
    ; - clobbered: eax, ecx, edx
    print_message:
        push    ebp
        mov     ebp, esp

        ; DWORD bytes;
        sub     esp, 4

        ; hStdOut = GetstdHandle( STD_OUTPUT_HANDLE )
        
        push    -11
        
        call    _GetStdHandle@4
        
        mov     ecx, eax    

        ; /

        ; WINAPI BOOL WriteFile(
        ;     [in]                HANDLE       hFile,
        ;     [in]                LPCVOID      lpBuffer,
        ;     [in]                DWORD        nNumberOfBytesToWrite,
        ;     [out, optional]     LPDWORD      lpNumberOfBytesWritten,
        ;     [in, out, optional] LPOVERLAPPED lpOverlapped
        ; );
        ;
        ; WriteFile( hstdOut, message, length(message), NULL, NULL);

        push    0

        push    0

        mov     eax, [ebp + 8]
        push    eax
        
        mov     eax, [ebp + 12]
        push    eax

        push    ecx
        call    _WriteFile@20

        ; /

        ; clean up stack
        mov     esp, ebp
        pop     ebp

        ret

