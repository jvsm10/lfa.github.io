var afnd_delegate = (function() {
  var self = null;
  var afnd = null;
  var container = null;
  var dialogDiv = null;
  var dialogActiveConnection = null;
  var emptyLabel = 'ϵ';
  
  var statusConnectors = [];
  
  var updateUIForDebug = function() {
    var status = afnd.status();
    
    $('.current').removeClass('current');
    $.each(statusConnectors, function(index, connection) {
      connection.setPaintStyle(jsPlumb.Defaults.PaintStyle);
    });
    
    var comparisonChar = status.nextChar === '' ? emptyLabel : status.nextChar;
    $.each(status.states, function(index, state) {
      var curState = $('#' + state).addClass('current');
      jsPlumb.select({source:state}).each(function(connection) {
        if (connection.getLabel() === comparisonChar) {
          statusConnectors.push(connection);
          connection.setPaintStyle({strokeStyle:'#0a0'});
        }
      });
    });
    return self;
  };

  var dialogSave = function(update) {
    var inputChar = $('#afnd_dialog_readCharTxt').val();
    if (inputChar.length > 1) {inputChar = inputChar[0];}
    
    if (update) {
      afnd.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    } if (afnd.hasTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId)) {
      alert(dialogActiveConnection.sourceId + " já existe transição para " + dialogActiveConnection.targetId + " em " + (inputChar || emptyLabel));
      return;
    }
    
    dialogActiveConnection.setLabel(inputChar || emptyLabel);
    afnd.addTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId);
    dialogDiv.dialog("close");
  };

  var dialogCancel = function(update) {
    if (!update) {fsm.removeConnection(dialogActiveConnection);}
    dialogDiv.dialog("close");
  };
  
  var dialogDelete = function() {
    afnd.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    fsm.removeConnection(dialogActiveConnection);
    dialogDiv.dialog("close");
  };
  
  var dialogClose = function() {
    dialogActiveConnection = null;
  };

  var makeDialog = function() {
    dialogDiv = $('<div></div>', {style:'text-align:center;'});
    $('<div></div>', {style:'font-size:small;'}).html('Deixe em branco para vazio: '+emptyLabel+'<br />').appendTo(dialogDiv);
    $('<span></span>', {id:'afnd_dialog_stateA', 'class':'tranStart'}).appendTo(dialogDiv);
    $('<input />', {id:'afnd_dialog_readCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;'})
      .val('A')
      .keypress(function(event) {
        if (event.which === $.ui.keyCode.ENTER) {dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(-1).click();}
      })
      .appendTo(dialogDiv);
    $('<span></span>', {id:'afnd_dialog_stateB', 'class':'tranEnd'}).appendTo(dialogDiv);
    $('body').append(dialogDiv);
    
    dialogDiv.dialog({
      dialogClass: "no-close",
      autoOpen: false,
      title: 'Entre com transição',
      height: 220,
      width: 350,
      modal: true,
      open: function() {dialogDiv.find('input').focus().select();}
    });
  };

  return {
    init: function() {
      self = this;
      afnd = new AFND();
      makeDialog();
      return self;
    },
    
    setContainer: function(newContainer) {
      container = newContainer;
      return self;
    },
    
    fsm: function() {
      return afnd;
    },
    
    connectionAdded: function(info) {
      dialogActiveConnection = info.connection;
      $('#afnd_dialog_stateA').html(dialogActiveConnection.sourceId + '&nbsp;');
      $('#afnd_dialog_stateB').html('&nbsp;' + dialogActiveConnection.targetId);
      
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(false);},
        Save: function(){dialogSave(false);}
      }).dialog("open");
    },
    
    connectionClicked: function(connection) {
      dialogActiveConnection = connection;
      $('#afnd_dialog_readCharTxt').val(dialogActiveConnection.getLabel());
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(true);},
        Delete: dialogDelete,
        Save: function(){dialogSave(true);}
      }).dialog("open");
    },
    
    updateUI: updateUIForDebug,
    
    getEmptyLabel: function() {return emptyLabel;},
    
    reset: function() {
      afnd = new AFND();
      return self;
    },
    
    debugStart: function() {
      return self;
    },
    
    debugStop: function() {
      $('.current').removeClass('current');
      return self;
    },
    
    serialize: function() {
      // Converte para um formato serializado
      var model = {};
      model.type = 'AFND';
      model.afnd = afnd.serialize();
      model.states = {};
      model.transitions = [];
      $.each(model.afnd.transitions, function(stateA, transition) {
        model.states[stateA] = {};
        $.each(transition, function(character, states) {
          $.each(states, function(index, stateB) {
            model.states[stateB] = {};
            model.transitions.push({stateA:stateA, label:(character || emptyLabel), stateB:stateB});
          });
        });
      });
      $.each(model.afnd.acceptStates, function(index, state) {
        model.states[state].isAccept = true;
      });
      return model;
    },
    
    deserialize: function(model) {
      afnd.deserialize(model.afnd);
    }
  };
}()).init();
