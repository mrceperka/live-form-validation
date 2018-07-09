import defaultOptions from './options'

var LiveForm = {
  options: defaultOptions,
  forms: {},
}

LiveForm.setOptions = function(userOptions) {
  for (var prop in userOptions) {
    if (Object.prototype.hasOwnProperty.call(this.options, prop)) {
      this.options[prop] = userOptions[prop]
    }
  }
}

// Allow setting options before loading the script just by creating global LiveFormOptions object with options.
if (typeof window.LiveFormOptions !== 'undefined') {
  LiveForm.setOptions(window.LiveFormOptions)
}

LiveForm.isSpecialKey = function(k) {
  // http://stackoverflow.com/questions/7770561/jquery-javascript-reject-control-keys-on-keydown-event
  return (
    k == 20 /* Caps lock */ ||
    k == 16 /* Shift */ ||
    k == 9 /* Tab */ ||
    k == 27 /* Escape Key */ ||
    k == 17 /* Control Key */ ||
    k == 91 /* Windows Command Key */ ||
    k == 19 /* Pause Break */ ||
    k == 18 /* Alt Key */ ||
    k == 93 /* Right Click Point Key */ ||
    (k >= 35 && k <= 40) /* Home, End, Arrow Keys */ ||
    k == 45 /* Insert Key */ ||
    (k >= 33 && k <= 34) /*Page Down, Page Up */ ||
    (k >= 112 && k <= 123) /* F1 - F12 */ ||
    (k >= 144 && k <= 145)
  ) /* Num Lock, Scroll Lock */
}

/**
 * Handlers for all the events that trigger validation
 * YOU CAN CHANGE these handlers (ie. to use jQuery events instead)
 */
LiveForm.setupHandlers = function(el) {
  if (this.hasClass(el, this.options.disableLiveValidationClass)) return

  // Check if element was already initialized
  if (el.getAttribute('data-lfv-initialized')) return

  // Remember we initialized this element so we won't do it again
  el.setAttribute('data-lfv-initialized', 'true')

  var handler = function(event) {
    event = event || window.event
    Nette.validateControl(event.target ? event.target : event.srcElement)
  }

  var self = this

  Nette.addEvent(el, 'change', handler)
  Nette.addEvent(el, 'blur', handler)
  Nette.addEvent(el, 'keydown', function(event) {
    if (
      !self.isSpecialKey(event.which) &&
      (self.options.wait === false || self.options.wait >= 200)
    ) {
      // Hide validation span tag.
      self.removeClass(
        self.getGroupElement(this),
        self.options.controlErrorClass
      )
      self.removeClass(
        self.getGroupElement(this),
        self.options.controlValidClass
      )

      var messageEl = self.getMessageElement(this)
      messageEl.innerHTML = ''
      messageEl.className = ''

      // Cancel timeout to run validation handler
      if (self.timeout) {
        clearTimeout(self.timeout)
      }
    }
  })
  Nette.addEvent(el, 'keyup', function(event) {
    if (self.options.wait !== false) {
      event = event || window.event
      if (event.keyCode !== 9) {
        if (self.timeout) clearTimeout(self.timeout)
        self.timeout = setTimeout(function() {
          handler(event)
        }, self.options.wait)
      }
    }
  })
}

LiveForm.processServerErrors = function(el) {
  var messageEl = this.getMessageElement(el)
  var parentEl = this.getMessageParent(el) // This is parent element which contain the error elements

  var errors = []

  // Find existing error elements by class (from server-validation)
  var errorEls = parentEl.getElementsByClassName(this.options.messageErrorClass)
  for (var i = errorEls.length - 1; i > -1; i--) {
    // Don't touch our main message element
    if (errorEls[i] == messageEl) continue

    // Remove only direct children
    var errorParent = errorEls[i].parentNode
    if (errorParent == parentEl) {
      errors.push(errorEls[i].outerHTML)
      errorParent.removeChild(errorEls[i])
    }
  }

  // Wrap all server errors into one element
  if (errors.length > 0) {
    messageEl.innerHTML = errors.join('')
  }
}

LiveForm.addError = function(el, message) {
  // Ignore elements with disabled live validation
  if (this.hasClass(el, this.options.disableLiveValidationClass)) return

  var groupEl = this.getGroupElement(el)
  this.setFormProperty(el.form, 'hasError', true)
  this.addClass(groupEl, this.options.controlErrorClass)

  if (this.options.showValid) {
    this.removeClass(groupEl, this.options.controlValidClass)
  }

  if (!message) {
    message = '&nbsp;'
  } else {
    message = this.options.messageErrorPrefix + message
  }

  var messageEl = this.getMessageElement(el)
  messageEl.innerHTML = message
  messageEl.className = this.options.messageErrorClass
}

LiveForm.removeError = function(el) {
  // We don't want to remove any errors during onLoadValidation
  if (this.getFormProperty(el.form, 'onLoadValidation')) return

  var groupEl = this.getGroupElement(el)
  this.removeClass(groupEl, this.options.controlErrorClass)

  var id = el.getAttribute('data-lfv-message-id')
  if (id) {
    var messageEl = this.getMessageElement(el)
    messageEl.innerHTML = ''
    messageEl.className = ''
  }

  if (this.options.showValid) {
    if (this.showValid(el))
      this.addClass(groupEl, this.options.controlValidClass)
    else this.removeClass(groupEl, this.options.controlValidClass)
  }
}

LiveForm.showValid = function(el) {
  if (el.type) {
    var type = el.type.toLowerCase()
    if (type == 'checkbox' || type == 'radio') {
      return false
    }
  }

  var rules = Nette.parseJSON(el.getAttribute('data-nette-rules'))
  if (rules.length == 0) {
    return false
  }

  if (Nette.getEffectiveValue(el) == '') {
    return false
  }

  if (this.hasClass(el, this.options.disableShowValidClass)) {
    return false
  }

  return true
}

LiveForm.getGroupElement = function(el) {
  if (this.options.showMessageClassOnParent === false) return el

  var groupEl = el

  while (!this.hasClass(groupEl, this.options.showMessageClassOnParent)) {
    groupEl = groupEl.parentNode

    if (groupEl === null) {
      return el
    }
  }

  return groupEl
}

LiveForm.getMessageId = function(el) {
  var tmp = el.id + this.options.messageIdPostfix

  // For elements without ID, or multi elements (with same name), we must generate whole ID ourselves
  if (el.name && (!el.id || !el.form.elements[el.name].tagName)) {
    // Strip possible [] from name
    var name = el.name.match(/\[\]$/) ? el.name.match(/(.*)\[\]$/)[1] : el.name
    // Generate new ID based on form ID, element name and messageIdPostfix from options
    tmp =
      (el.form.id ? el.form.id : 'frm') +
      '-' +
      name +
      this.options.messageIdPostfix
  }

  // We want unique ID which doesn't exist yet
  var id = tmp,
    i = 0
  while (document.getElementById(id)) {
    id = id + '_' + ++i
  }

  return id
}

LiveForm.getMessageElement = function(el) {
  // For multi elements (with same name) work only with first element attributes
  if (el.name && el.name.match(/\[\]$/)) {
    el = el.form.elements[el.name].tagName ? el : el.form.elements[el.name][0]
  }

  var id = el.getAttribute('data-lfv-message-id')
  if (!id) {
    // ID is not specified yet, let's create a new one
    id = this.getMessageId(el)

    // Remember this id for next use
    el.setAttribute('data-lfv-message-id', id)
  }

  var messageEl = document.getElementById(id)
  if (!messageEl) {
    // Message element doesn't exist, lets create a new one
    messageEl = document.createElement(this.options.messageTag)
    messageEl.id = id
    if (
      el.style.display == 'none' &&
      !this.hasClass(el, this.options.enableHiddenMessageClass)
    ) {
      messageEl.style.display = 'none'
    }

    var parentEl = this.getMessageParent(el)
    if (parentEl) {
      parentEl.appendChild(messageEl)
    }
  }

  return messageEl
}

LiveForm.getMessageParent = function(el) {
  var parentEl = el.parentNode
  var parentFound = false

  if (this.options.messageParentClass !== false) {
    parentFound = true
    while (!this.hasClass(parentEl, this.options.messageParentClass)) {
      parentEl = parentEl.parentNode

      if (parentEl === null) {
        // We didn't found wanted parent, so use element's direct parent
        parentEl = el.parentNode
        parentFound = false
        break
      }
    }
  }

  // Don't append error message to radio/checkbox input's label, but along label
  if (el.type) {
    var type = el.type.toLowerCase()
    if (
      (type == 'checkbox' || type == 'radio') &&
      parentEl.tagName == 'LABEL'
    ) {
      parentEl = parentEl.parentNode
    }
  }

  // For multi elements (with same name) use parent's parent as parent (if wanted one is not found)
  if (!parentFound && el.name && !el.form.elements[el.name].tagName) {
    parentEl = parentEl.parentNode
  }

  return parentEl
}

LiveForm.addClass = function(el, className) {
  if (!el.className) {
    el.className = className
  } else if (!this.hasClass(el, className)) {
    el.className += ' ' + className
  }
}

LiveForm.hasClass = function(el, className) {
  if (el.className)
    return el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
  return false
}

LiveForm.removeClass = function(el, className) {
  if (this.hasClass(el, className)) {
    var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
    var m = el.className.match(reg)
    el.className = el.className.replace(
      reg,
      m[1] == ' ' && m[2] == ' ' ? ' ' : ''
    )
  }
}

LiveForm.getFormProperty = function(form, propertyName) {
  if (form == null || this.forms[form.id] == null) return false

  return this.forms[form.id][propertyName]
}

LiveForm.setFormProperty = function(form, propertyName, value) {
  if (form == null) return

  if (this.forms[form.id] == null) this.forms[form.id] = {}

  this.forms[form.id][propertyName] = value
}

export default LiveForm
