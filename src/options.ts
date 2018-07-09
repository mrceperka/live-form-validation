export type TOptions = {
  // CSS class of control's parent where error/valid class should be added; or "false" to use control directly
  showMessageClassOnParent: string | boolean

  // CSS class of control's parent where error/valid message should be added (fallback to direct parent if not found); or "false" to use control's direct parent
  messageParentClass: string | boolean

  // CSS class for an invalid control
  controlErrorClass: string

  // CSS class for a valid control
  controlValidClass: string

  // CSS class for an error message
  messageErrorClass: string

  // control with this CSS class will show error/valid message even when control itself is hidden (useful for controls which are hidden and wrapped into special component)
  enableHiddenMessageClass: string

  // control with this CSS class will have disabled live validation
  disableLiveValidationClass: string

  // control with this CSS class will not show valid message
  disableShowValidClass: string

  // tag that will hold the error/valid message
  messageTag: string

  // message element id = control id + this postfix
  messageIdPostfix: string

  // show this html before error message itself
  messageErrorPrefix: string

  // show all errors when submitting form; or use "false" to show only first error
  showAllErrors: boolean

  // show message when valid
  showValid: boolean

  // delay in ms before validating on keyup/keydown; or use "false" to disable it
  wait: boolean

  // vertical screen offset in px to scroll after focusing element with error (useful when using fixed navbar menu which may otherwise obscure the element in focus); or use "false" for default behavior
  focusScreenOffsetY: number | boolean
}

const defaultOptions: TOptions = {
  showMessageClassOnParent: 'form-group',
  messageParentClass: false,
  controlErrorClass: 'has-error',
  controlValidClass: 'has-success',
  messageErrorClass: 'help-block text-danger',
  enableHiddenMessageClass: 'show-hidden-error',
  disableLiveValidationClass: 'no-live-validation',
  disableShowValidClass: 'no-show-valid',
  messageTag: 'span',
  messageIdPostfix: '_message',
  messageErrorPrefix:
    '&nbsp;<i class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></i>&nbsp;',
  showAllErrors: true,
  showValid: false,
  wait: false,
  focusScreenOffsetY: false,
}

export default defaultOptions
