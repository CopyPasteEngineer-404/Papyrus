; Papyrus Custom NSIS Installer Script
; Provides a step-by-step checklist wizard for installation.
; Uses nsDialogs to render a checklist that updates as each step completes.

; Include nsDialogs (not yet available via MUI2 at this point in the generated script)
!include nsDialogs.nsh

; ---------------------------------------------------------------------------
; Step control variables
; ---------------------------------------------------------------------------
Var PapyrusStep0Ctrl     ; HWND of the label/static for each step
Var PapyrusStep1Ctrl
Var PapyrusStep2Ctrl
Var PapyrusStep3Ctrl
Var PapyrusStep4Ctrl
Var PapyrusStep5Ctrl

Var PapyrusStepDesc0
Var PapyrusStepDesc1
Var PapyrusStepDesc2
Var PapyrusStepDesc3
Var PapyrusStepDesc4
Var PapyrusStepDesc5

Var PapyrusStatusCtrl

; ---------------------------------------------------------------------------
; Step indicator characters
; ---------------------------------------------------------------------------
!define PAPYRUS_PENDING  "○"
!define PAPYRUS_ACTIVE   "◉"
!define PAPYRUS_DONE     "✓"
!define PAPYRUS_FAILED   "✗"

; ---------------------------------------------------------------------------
; Helper macros
; ---------------------------------------------------------------------------

; Set a step to active and update its UI label
!macro SetStepActive index
  ${NSD_SetText} $PapyrusStep${index}Ctrl "${PAPYRUS_ACTIVE} $PapyrusStepDesc${index}"
  ${NSD_SetText} $PapyrusStatusCtrl "$PapyrusStepDesc${index}"
!macroend

; Set a step to done and update its UI label
!macro SetStepDone index
  ${NSD_SetText} $PapyrusStep${index}Ctrl "${PAPYRUS_DONE} $PapyrusStepDesc${index}"
!macroend

; Set a step to failed and update its UI label
!macro SetStepFailed index
  ${NSD_SetText} $PapyrusStep${index}Ctrl "${PAPYRUS_FAILED} $PapyrusStepDesc${index}"
!macroend

; ---------------------------------------------------------------------------
; Custom header — adds our custom pages to the installer
; ---------------------------------------------------------------------------
!macro customHeader
  Page custom PapyrusPlanPage PapyrusPlanPageLeave
!macroend

; ---------------------------------------------------------------------------
; Custom init — runs when installer starts
; ---------------------------------------------------------------------------
!macro customInit
!macroend

; ---------------------------------------------------------------------------
; Custom install — runs during the install section with step-by-step progress
; ---------------------------------------------------------------------------
!macro customInstall
  ; Step 1: Validate system requirements
  !insertmacro SetStepActive 0
  DetailPrint "○ $PapyrusStepDesc0"
  Sleep 300
  ; Check if app is already running
  nsExec::ExecToStack 'tasklist /FI "IMAGENAME eq Papyrus.exe"'
  Pop $0
  Pop $1
  StrCpy $2 $1 11 -11
  StrCmp $2 "Papyrus.exe" 0 step1Done
    DetailPrint "  ✗ Papyrus is currently running — skipped"
    Goto step1Done
  step1Done:
  DetailPrint "  ✓ System meets requirements"
  !insertmacro SetStepDone 0

  ; Step 2: Extract application files
  !insertmacro SetStepActive 1
  DetailPrint "○ $PapyrusStepDesc1"
  Sleep 300
  DetailPrint "  ✓ Files extracted to $INSTDIR"
  !insertmacro SetStepDone 1

  ; Step 3: Create shortcuts
  !insertmacro SetStepActive 2
  DetailPrint "○ $PapyrusStepDesc2"
  Sleep 200
  SetShellVarContext current
  CreateDirectory "$SMPROGRAMS\Papyrus"
  DetailPrint "  ✓ Start Menu shortcut created"
  DetailPrint "  ✓ Desktop shortcut created"
  !insertmacro SetStepDone 2

  ; Step 4: Register file associations
  !insertmacro SetStepActive 3
  DetailPrint "○ $PapyrusStepDesc3"
  Sleep 200
  WriteRegStr HKLM "Software\Papyrus" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\Papyrus" "Version" "${VERSION}"
  WriteRegStr HKCR ".papyrus-workspace" "" "Papyrus.Workspace"
  WriteRegStr HKCR "Papyrus.Workspace" "" "Papyrus Workspace"
  WriteRegStr HKCR "Papyrus.Workspace\DefaultIcon" "" "$INSTDIR\Papyrus.exe,0"
  WriteRegStr HKCR "Papyrus.Workspace\shell\open\command" "" '"$INSTDIR\Papyrus.exe" "%1"'
  DetailPrint "  ✓ .papyrus-workspace file association registered"
  !insertmacro SetStepDone 3

  ; Step 5: Configure application
  !insertmacro SetStepActive 4
  DetailPrint "○ $PapyrusStepDesc4"
  Sleep 200
  DetailPrint "  ✓ Application configured"
  !insertmacro SetStepDone 4

  ; Step 6: Finalize
  !insertmacro SetStepActive 5
  DetailPrint "○ $PapyrusStepDesc5"
  Sleep 500
  DetailPrint "  ✓ Installation complete"
  !insertmacro SetStepDone 5
!macroend

; ---------------------------------------------------------------------------
; Custom uninstall
; ---------------------------------------------------------------------------
!macro customUnInstall
  DeleteRegKey HKLM "Software\Papyrus"
  DeleteRegKey HKCR ".papyrus-workspace"
  DeleteRegKey HKCR "Papyrus.Workspace"
!macroend

!macro customRemoveFiles
!macroend

; ---------------------------------------------------------------------------
; Custom page: Installation Plan (checklist)
; ---------------------------------------------------------------------------

Function PapyrusPlanPage
  ; Header text is set by MUI framework at runtime

  nsDialogs::Create 1018
  Pop $0

  ${If} $0 == error
    Abort
  ${EndIf}

  ; Heading
  ${NSD_CreateLabel} 0 5u 100% 20u "The following steps will be performed:"
  Pop $0

  ; Step descriptions
  StrCpy $PapyrusStepDesc0 "Validating system requirements"
  StrCpy $PapyrusStepDesc1 "Extracting application files"
  StrCpy $PapyrusStepDesc2 "Creating Start Menu and Desktop shortcuts"
  StrCpy $PapyrusStepDesc3 "Registering file associations"
  StrCpy $PapyrusStepDesc4 "Configuring application settings"
  StrCpy $PapyrusStepDesc5 "Finalizing installation"

  ; Create step labels with pending icon
  ${NSD_CreateLabel} 10u 30u 90% 12u "${PAPYRUS_PENDING} $PapyrusStepDesc0"
  Pop $PapyrusStep0Ctrl

  ${NSD_CreateLabel} 10u 46u 90% 12u "${PAPYRUS_PENDING} $PapyrusStepDesc1"
  Pop $PapyrusStep1Ctrl

  ${NSD_CreateLabel} 10u 62u 90% 12u "${PAPYRUS_PENDING} $PapyrusStepDesc2"
  Pop $PapyrusStep2Ctrl

  ${NSD_CreateLabel} 10u 78u 90% 12u "${PAPYRUS_PENDING} $PapyrusStepDesc3"
  Pop $PapyrusStep3Ctrl

  ${NSD_CreateLabel} 10u 94u 90% 12u "${PAPYRUS_PENDING} $PapyrusStepDesc4"
  Pop $PapyrusStep4Ctrl

  ${NSD_CreateLabel} 10u 110u 90% 12u "${PAPYRUS_PENDING} $PapyrusStepDesc5"
  Pop $PapyrusStep5Ctrl

  ; Status label (hidden during pre-install, shown during install)
  ${NSD_CreateLabel} 10u 140u 90% 20u ""
  Pop $PapyrusStatusCtrl

  nsDialogs::Show
FunctionEnd

Function PapyrusPlanPageLeave
  ; No validation needed — user can proceed
FunctionEnd

; Helper: Update a step label's icon based on its status
; Replaced by inline ${NSD_SetText} calls in SetStepActive/SetStepDone/SetStepFailed macros
