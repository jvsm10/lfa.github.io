function AFND(useDefaults) {
  "use strict";
  this.transitions = {};
  this.startState = useDefaults ? 'start' : null;
  this.acceptStates = useDefaults ? ['accept'] : [];
  
  this.processor = {
    input: null,
    inputIndex: 0,
    inputLength: 0,
    states: [],
    status: null,
    nextStep: null
  };
}

$(function() { 
  "use strict";

AFND.prototype.transition = function(state, character) {
  var retVal = (this.transitions[state]) ? this.transitions[state][character] : null;
  return !retVal ? null : retVal;
};

AFND.prototype.deserialize = function(json) {
  this.transitions = json.transitions;
  this.startState = json.startState;
  this.acceptStates = json.acceptStates;
  return this;
};
AFND.prototype.serialize = function() {
  return {transitions:this.transitions, startState:this.startState, acceptStates:this.acceptStates};
};


AFND.prototype.loadFromString = function(JSONdescription) {
  var parsedJSON = JSON.parse(JSONdescription);
  return this.deserialize(parsedJSON);
};
AFND.prototype.saveToString = function() {
  return JSON.stringify(this.serialize());
};

AFND.prototype.addTransition = function(stateA, character, stateB) {
  if (!this.transitions[stateA]) {this.transitions[stateA] = {};}
  if (!this.transitions[stateA][character]) {this.transitions[stateA][character] = [];}
  this.transitions[stateA][character].push(stateB);
  return this;
};

AFND.prototype.hasTransition = function(stateA, character, stateB) {
  if (this.transitions[stateA] && this.transitions[stateA][character]) {
    return this.transitions[stateA][character].indexOf(stateB) >= 0;
  }
  return false;
};

AFND.prototype.removeTransitions = function(state) {
  delete this.transitions[state];
  var self = this;
  $.each(self.transitions, function(stateA, sTrans) {
    $.each(sTrans, function(char, states) {
      if (states.indexOf(state) >= 0) {
        self.removeTransition(stateA, char, state);
      }
    });
  });
  return this;
};

AFND.prototype.removeTransition = function(stateA, character, stateB) {
  if (this.hasTransition(stateA, character, stateB)) {
    this.transitions[stateA][character].splice(this.transitions[stateA][character].indexOf(stateB), 1);
  }
  return this;
};

AFND.prototype.setStartState = function(state) {
  this.startState = state;
  return this;
};

AFND.prototype.addAcceptState = function(state) {
  this.acceptStates.push(state);
  return this;
};
AFND.prototype.removeAcceptState = function(state) {
  var stateI = -1;
  if ((stateI = this.acceptStates.indexOf(state)) >= 0) {
    this.acceptStates.splice(stateI, 1);
  }
  return this;
};

AFND.prototype.accepts = function(input) {
  var _status = this.stepInit(input);
  while (_status === 'Active') {_status = this.step();}
  return _status === 'Accept';
};

AFND.prototype.status = function() {
  var nextChar = null;
  if (this.processor.status === 'Active') {
    if (this.processor.nextStep === 'input' && this.processor.input.length > this.processor.inputIndex) {
      nextChar = this.processor.input.substr(this.processor.inputIndex, 1);
    } else if (this.processor.nextStep === 'epsilons') {
      nextChar = '';
    }
  }
  return {
    states: this.processor.states,
    input: this.processor.input,
    inputIndex: this.processor.inputIndex,
    nextChar: nextChar,
    status: this.processor.status
  };
};

AFND.prototype.stepInit = function(input) {
  this.processor.input = input;
  this.processor.inputLength = this.processor.input.length;
  this.processor.inputIndex = 0;
  this.processor.states = [this.startState];
  this.processor.status = 'Active';
  this.processor.nextStep = 'epsilons';
  return this.updateStatus();
};
AFND.prototype.step = function() {
  switch (this.processor.nextStep) {
    case 'epsilons':
      this.followEpsilonTransitions();
      this.processor.nextStep = 'input';
      break;
    case 'input':
      var newStates = [];
      var char = this.processor.input.substr(this.processor.inputIndex, 1);
      var state = null;
      while (state = this.processor.states.shift()) {
        var tranStates = this.transition(state, char);
        if (tranStates) {$.each(tranStates, function(index, tranState) {
            if (newStates.indexOf(tranState) === -1) {newStates.push(tranState);}
        });}
      };
      ++this.processor.inputIndex;
      this.processor.states = newStates;
      this.processor.nextStep = 'epsilons';
      break;
  }
  return this.updateStatus();
};
AFND.prototype.followEpsilonTransitions = function() {
  var self = this;
  var changed = true;
  while (changed) {
    changed = false;
    $.each(self.processor.states, function(index, state) {
      var newStates = self.transition(state, '');
      if (newStates) {$.each(newStates, function(sIndex, newState) {
          var match = false;
          $.each(self.processor.states, function(oIndex, checkState) {
            if (checkState === newState) {
              match = true;
              return false; 
            }
          });
          if (!match) {
            changed = true;
            self.processor.states.push(newState);
          }
      });}
    });
  }
};
AFND.prototype.updateStatus = function() {
  var self = this;
  if (self.processor.states.length === 0) {
    self.processor.status = 'Reject';
  }
  if (self.processor.inputIndex === self.processor.inputLength) {
   $.each(self.processor.states, function(index, state) {
      if (self.acceptStates.indexOf(state) >= 0) {
        self.processor.status = 'Accept';
        return false; 
      }
    });
  }
  return self.processor.status;
};

});
