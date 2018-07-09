// @ts-ignore
import * as Nette from 'nette-forms'
import LiveForm from './live-form'

/**
 * Returns the value of form element.
 */
const getValue = function(elem) {
  var i
  if (!elem) {
    return null
  } else if (!elem.tagName) {
    // RadioNodeList, HTMLCollection, array
    return elem[0] ? getValue(elem[0]) : null
  } else if (elem.type === 'radio') {
    var elements = elem.form.elements // prevents problem with name 'item' or 'namedItem'
    for (i = 0; i < elements.length; i++) {
      if (elements[i].name === elem.name && elements[i].checked) {
        return elements[i].value
      }
    }
    return null
  } else if (elem.type === 'file') {
    return elem.files || elem.value
  } else if (elem.tagName.toLowerCase() === 'select') {
    var index = elem.selectedIndex,
      options = elem.options,
      values = []

    if (elem.type === 'select-one') {
      return index < 0 ? null : options[index].value
    }

    for (i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value)
      }
    }
    return values
  } else if (elem.name && elem.name.match(/\[\]$/)) {
    // multiple elements []
    var elements = elem.form.elements[elem.name].tagName
        ? [elem]
        : elem.form.elements[elem.name],
      values = []

    for (i = 0; i < elements.length; i++) {
      // LiveForm: original netteForms.js code
      /*if (elements[i].type !== 'checkbox' || elements[i].checked) {
				values.push(elements[i].value);
			}*/
      // LiveForm: addition
      var value = elements[i].value
      if (elements[i].type === 'checkbox' && elements[i].checked) {
        values.push(value)
      } else if (elements[i].type !== 'checkbox' && value !== '') {
        values.push(value)
      }
    }
    return values
  } else if (elem.type === 'checkbox') {
    return elem.checked
  } else if (elem.tagName.toLowerCase() === 'textarea') {
    return elem.value.replace('\r', '')
  } else {
    return elem.value.replace('\r', '').replace(/^\s+|\s+$/g, '')
  }
}
/**
 * Validates form element against given rules.
 */
const validateControl = function(elem, rules, onlyCheck, value, emptyOptional) {
  // LiveForm: addition
  // Fix for CheckboxList - validation rules are present always only on first input
  if (
    elem.name &&
    elem.name.match(/\[\]$/) &&
    elem.type.toLowerCase() == 'checkbox'
  ) {
    elem = elem.form.elements[elem.name].tagName
      ? elem
      : elem.form.elements[elem.name][0]
  }

  elem = elem.tagName ? elem : elem[0] // RadioNodeList
  rules = rules || Nette.parseJSON(elem.getAttribute('data-nette-rules'))
  value = value === undefined ? { value: Nette.getEffectiveValue(elem) } : value

  for (var id = 0, len = rules.length; id < len; id++) {
    var rule = rules[id],
      op = rule.op.match(/(~)?([^?]+)/),
      curElem = rule.control ? elem.form.elements.namedItem(rule.control) : elem

    rule.neg = op[1]
    rule.op = op[2]
    rule.condition = !!rule.rules

    if (!curElem) {
      continue
    } else if (rule.op === 'optional') {
      emptyOptional = !Nette.validateRule(elem, ':filled', null, value)
      continue
    } else if (emptyOptional && !rule.condition && rule.op !== ':filled') {
      continue
    }

    curElem = curElem.tagName ? curElem : curElem[0] // RadioNodeList
    var curValue =
        elem === curElem ? value : { value: Nette.getEffectiveValue(curElem) },
      success = Nette.validateRule(curElem, rule.op, rule.arg, curValue)

    if (success === null) {
      continue
    } else if (rule.neg) {
      success = !success
    }

    if (rule.condition && success) {
      if (
        !validateControl(
          elem,
          rule.rules,
          onlyCheck,
          value,
          rule.op === ':blank' ? false : emptyOptional
        )
      ) {
        return false
      }
    } else if (!rule.condition && !success) {
      if (Nette.isDisabled(curElem)) {
        continue
      }
      if (!onlyCheck) {
        var arr = Nette.isArray(rule.arg) ? rule.arg : [rule.arg],
          message = rule.msg.replace(/%(value|\d+)/g, function(foo, m) {
            return getValue(
              m === 'value'
                ? curElem
                : elem.form.elements.namedItem(arr[m].control)
            )
          })
        addError(curElem, message)
      }
      return false
    }
  }

  if (elem.type === 'number' && !elem.validity.valid) {
    if (!onlyCheck) {
      addError(elem, 'Please enter a valid value.')
    }
    return false
  }

  // LiveForm: addition
  if (!onlyCheck) {
    LiveForm.removeError(elem)
  }

  return true
}

/**
 * Validates whole form.
 */
const validateForm = function(sender, onlyCheck) {
  var form = sender.form || sender,
    scope = false

  // LiveForm: addition
  LiveForm.setFormProperty(form, 'hasError', false)

  // LiveForm: original netteForms.js code
  // Nette.formErrors = [];

  if (
    form['nette-submittedBy'] &&
    form['nette-submittedBy'].getAttribute('formnovalidate') !== null
  ) {
    var scopeArr = Nette.parseJSON(
      form['nette-submittedBy'].getAttribute('data-nette-validation-scope')
    )
    if (scopeArr.length) {
      scope = new RegExp('^(' + scopeArr.join('-|') + '-)')
    } else {
      // LiveForm: original netteForms.js code
      // Nette.showFormErrors(form, []);
      return true
    }
  }

  var radios = {},
    i,
    elem
  // LiveForm: addition
  var success = true

  for (i = 0; i < form.elements.length; i++) {
    elem = form.elements[i]

    if (
      elem.tagName &&
      !(
        elem.tagName.toLowerCase() in
        { input: 1, select: 1, textarea: 1, button: 1 }
      )
    ) {
      continue
    } else if (elem.type === 'radio') {
      if (radios[elem.name]) {
        continue
      }
      radios[elem.name] = true
    }

    if (
      (scope && !elem.name.replace(/]\[|\[|]|$/g, '-').match(scope)) ||
      Nette.isDisabled(elem)
    ) {
      continue
    }

    // LiveForm: addition
    success = Nette.validateControl(elem) && success
    if (!success && !LiveForm.options.showAllErrors) {
      break
    }
    // LiveForm: original netteForms.js code
    /*if (!Nette.validateControl(elem, null, onlyCheck) && !Nette.formErrors.length) {
			return false;
		}*/
  }
  // LiveForm: change
  return success

  // LiveForm: original netteForms.js code
  /*var success = !Nette.formErrors.length;
	Nette.showFormErrors(form, Nette.formErrors);
	return success;*/
}

// LiveForm: change
/**
 * Display error message.
 */
const addError = function(elem, message) {
  // LiveForm: addition
  var noLiveValidation = LiveForm.hasClass(
    elem,
    LiveForm.options.disableLiveValidationClass
  )
  // User explicitly disabled live-validation so we want to show simple alerts
  if (noLiveValidation) {
    // notify errors for elements with disabled live validation (but only errors and not during onLoadValidation)
    if (
      message &&
      !LiveForm.getFormProperty(elem.form, 'hasError') &&
      !LiveForm.getFormProperty(elem.form, 'onLoadValidation')
    ) {
      alert(message)
    }
  }
  if (elem.focus && !LiveForm.getFormProperty(elem.form, 'hasError')) {
    if (!LiveForm.focusing) {
      LiveForm.focusing = true
      elem.focus()
      setTimeout(function() {
        LiveForm.focusing = false

        // Scroll by defined offset (if enabled)
        // NOTE: We use it with setTimetout because IE9 doesn't always catch instant scrollTo request
        var focusOffsetY = LiveForm.options.focusScreenOffsetY
        if (
          focusOffsetY !== false &&
          elem.getBoundingClientRect().top < focusOffsetY
        ) {
          window.scrollBy(0, elem.getBoundingClientRect().top - focusOffsetY)
        }
      }, 10)
    }
  }
  if (!noLiveValidation) {
    LiveForm.addError(elem, message)
  }
}

/**
 * Setup handlers.
 */
const initForm = function(form) {
  form.noValidate = 'novalidate'

  // LiveForm: addition
  LiveForm.forms[form.id] = {
    hasError: false,
    onLoadValidation: false,
  }

  Nette.addEvent(form, 'submit', function(e) {
    if (!Nette.validateForm(form)) {
      if (e && e.stopPropagation) {
        e.stopPropagation()
        e.preventDefault()
      } else if (window.event) {
        event.cancelBubble = true
        event.returnValue = false
      }
    }
  })

  Nette.toggleForm(form)

  // LiveForm: addition
  for (var i = 0; i < form.elements.length; i++) {
    LiveForm.setupHandlers(form.elements[i])
    LiveForm.processServerErrors(form.elements[i])
  }
}

/**
 * @private
 */
const initOnLoad = function() {
  Nette.addEvent(document, 'DOMContentLoaded', function() {
    for (var i = 0; i < document.forms.length; i++) {
      var form = document.forms[i]
      for (var j = 0; j < form.elements.length; j++) {
        if (form.elements[j].getAttribute('data-nette-rules')) {
          initForm(form)

          // LiveForm: addition
          if (LiveForm.hasClass(form, 'validate-on-load')) {
            // This is not so nice way, but I don't want to spoil validateForm, validateControl and other methods with another parameter
            LiveForm.setFormProperty(form, 'onLoadValidation', true)
            Nette.validateForm(form)
            LiveForm.setFormProperty(form, 'onLoadValidation', false)
          }

          break
        }
      }
    }

    Nette.addEvent(document.body, 'click', function(e) {
      var target = e.target || e.srcElement
      if (target.form && target.type in { submit: 1, image: 1 }) {
        target.form['nette-submittedBy'] = target
      }
    })
  })
}
export default {
  ...Nette,
  getValue,
  validateControl,
  validateForm,
  addError,
  initForm,
  initOnLoad,
}
