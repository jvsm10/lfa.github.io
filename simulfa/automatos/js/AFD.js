function AFD(useDefaults) {
  "use strict";
  this.transitions = {};
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];
  
  this.processor = {
    input: null,
    inputLength: 0,
    state: null,
    inputIndex: 0,
    status: null,
  };
}

$(function() { 
  "use strict";

AFD.prototype.transition = function(state, character) {
  var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
  return !retVal ? null : retVal;
};

AFD.prototype.deserialize = function(json) {
  this.transitions = json.transitions;
  this.startState = json.startState;
  this.acceptStates = json.acceptStates;
  return this;
};
AFD.prototype.serialize = function() {
  return {transitions:this.transitions, startState:this.startState, acceptStates:this.acceptStates};
};

AFD.prototype.loadFromString = function(JSONdescription) {
  var parsedJSON = JSON.parse(JSONdescription);
  return this.deserialize(parsedJSON);
};
AFD.prototype.saveToString = function() {
  return JSON.stringify(this.serialize());
};


AFD.prototype.addTransition = function(stateA, character, stateB) {
  if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
  this.transitions[stateA][character] = stateB;
  return this;
};

AFD.prototype.hasTransition = function(state, character) {
  if (this.transitions[state]) {return !!this.transitions[state][character];}
  return false;
};

// Remover todas as transições do estado
AFD.prototype.removeTransitions = function(state) {
  delete this.transitions[state];
  var self = this;
  $.each(self.transitions, function(stateA, sTrans) {
    $.each(sTrans, function(char, stateB) {
      if (stateB === state) {self.removeTransition(stateA, char);}
    });
  });
  return this;
};

AFD.prototype.removeTransition = function(stateA, character) {
  if (this.transitions[stateA]) {delete this.transitions[stateA][character];}
  return this;
};

AFD.prototype.setStartState = function(state) {
  this.startState = state;
  return this;
};

AFD.prototype.addAcceptState = function(state) {
  this.acceptStates.push(state);
  return this;
};
AFD.prototype.removeAcceptState = function(state) {
  var stateI = -1;
  if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
    this.acceptStates.splice(stateI, 1);
  }
  return this;
};

AFD.prototype.accepts = function(input) {
  var _status = this.stepInit(input);
  while (_status === 'Active') {_status = this.step();}
  return _status === 'Accept';
};

AFD.prototype.status = function() {
  return {
    state: this.processor.state, 
    input: this.processor.input,
    inputIndex: this.processor.inputIndex,
    nextChar: this.processor.input.substr(this.processor.inputIndex, 1),
    status: this.processor.status
  };
};

AFD.prototype.stepInit = function(input) {
  this.processor.input = input;
  this.processor.inputLength = this.processor.input.length;
  this.processor.inputIndex = 0;
  this.processor.state = this.startState;
  this.processor.status = (this.processor.inputLength === 0 && this.acceptStates.indexOf(this.processor.state) >= 0) ? 'Accept' : 'Active';
  return this.processor.status;
};
AFD.prototype.step = function() {
  if ((this.processor.state = this.transition(this.processor.state, this.processor.input.substr(this.processor.inputIndex++, 1))) === null) {this.processor.status = 'Reject';}
  if (this.processor.inputIndex === this.processor.inputLength) {this.processor.status = (this.acceptStates.indexOf(this.processor.state) >= 0 ? 'Accept' : 'Reject');}
  return this.processor.status;
};

});
