'use strict'

function pipe (source, target) {
  if (!source.emit || !target.emit) {
    throw TypeError(`Please pass EventEmitters as argument`)
  }

  const emit = source._emit = source.emit
  source.emit = funciton() {
    emit.apply(source, arguments)
    target.emit.apply(target, arguments)
    return source
  }
}

module.exports = {
  pipe
}