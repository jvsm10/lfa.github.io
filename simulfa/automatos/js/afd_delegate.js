var afd_delegate = (function() {
  var self = null;
  var afd = null;
  var container = null;
  var dialogDiv = null;
  var dialogActiveConnection = null;
  
  var statusConnector = null;

  var updateUIForDebug = function() {
    var status = afd.status();
    
    $('.current').removeClass('current');
    if (statusConnector) {statusConnector.setPaintStyle(jsPlumb.Defaults.PaintStyle);}
    
    var curState = $('#' + status.state).addClass('current');
    jsPlumb.select({source:status.state}).each(function(connection) {
      if (connection.getLabel() === status.nextChar) {
        statusConnector = connection;
        connection.setPaintStyle({strokeStyle:'#0a0'});
      }
    });
    return self;
  };

  var dialogSave = function(update) {
    var inputChar = $('#afd_dialog_readCharTxt').val();
    if (inputChar.length > 1) {inputChar = inputChar[0];}
    if (inputChar.length === 0) {
      alert("Automatos finito deterministico não pode ter transições vazias");
      return;
    }
    
    if (update) {
      afd.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    } if (afd.hasTransition(dialogActiveConnection.sourceId, inputChar)) {
      alert(dialogActiveConnection.sourceId + " já existe uma transição para " + inputChar);
      return;
    }
    
    dialogActiveConnection.setLabel(inputChar);
    afd.addTransition(dialogActiveConnection.sourceId, inputChar, dialogActiveConnection.targetId);
    dialogDiv.dialog("close");
  };

  var dialogCancel = function(update) {
    if (!update) {fsm.removeConnection(dialogActiveConnection);}
    dialogDiv.dialog("close");
  };
  
  var dialogDelete = function() {
    afd.removeTransition(dialogActiveConnection.sourceId, dialogActiveConnection.getLabel(), dialogActiveConnection.targetId);
    fsm.removeConnection(dialogActiveConnection);
    dialogDiv.dialog("close");
  };
  
  var dialogClose = function() {
    dialogActiveConnection = null;
  };

  var makeDialog = function() {
    dialogDiv = $('<div></div>', {style:'text-align:center;'});
    $('<div></div>', {style:'font-size:small;'}).html('Não é permitido transições vazias em AFDs<br />').appendTo(dialogDiv);
    $('<span></span>', {id:'afd_dialog_stateA', 'class':'tranStart'}).appendTo(dialogDiv);
    $('<input />', {id:'afd_dialog_readCharTxt', type:'text', maxlength:1, style:'width:30px;text-align:center;'})
      .val('A')
      .keypress(function(event) {
        if (event.which === $.ui.keyCode.ENTER) {dialogDiv.parent().find('div.ui-dialog-buttonset button').eq(-1).click();}
      })
      .appendTo(dialogDiv);
    $('<span></span>', {id:'afd_dialog_stateB', 'class':'tranEnd'}).appendTo(dialogDiv);
    $('body').append(dialogDiv);
    
    dialogDiv.dialog({
      dialogClass: "no-close",
      autoOpen: false,
      title: 'Entre com a transição',
      height: 220,
      width: 350,
      modal: true,
      open: function() {dialogDiv.find('input').focus().select();}
    });
  };

  return {
    init: function() {
      self = this;
      afd = new AFD();
      makeDialog();
      return self;
    },
    
    setContainer: function(newContainer) {
      container = newContainer;
      return self;
    },
    
    fsm: function() {
      return afd;
    },
    
    connectionAdded: function(info) {
      dialogActiveConnection = info.connection;
      $('#afd_dialog_stateA').html(dialogActiveConnection.sourceId + '&nbsp;');
      $('#afd_dialog_stateB').html('&nbsp;' + dialogActiveConnection.targetId);
      
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(false);},
        Save: function(){dialogSave(false);}
      }).dialog("open");
    },
    
    connectionClicked: function(connection) {
      dialogActiveConnection = connection;
      $('#afd_dialog_readCharTxt').val(dialogActiveConnection.getLabel());
      dialogDiv.dialog('option', 'buttons', {
        Cancel: function(){dialogCancel(true);},
        Delete: dialogDelete,
        Save: function(){dialogSave(true);}
      }).dialog("open");
    },
    
    updateUI: updateUIForDebug,
    
    getEmptyLabel: function() {return null;},
    
    reset: function() {
      afd = new AFD();
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
      // Converte afd em formato serializado 
      var model = {};
      model.type = 'AFD';
      model.afd = afd.serialize();
      model.states = {};
      model.transitions = [];
      $.each(model.afd.transitions, function(stateA, transition) {
        model.states[stateA] = {};
        $.each(transition, function(character, stateB) {
          model.states[stateB] = {};
          model.transitions.push({stateA:stateA, label:character, stateB:stateB});
        });
      });
      $.each(model.afd.acceptStates, function(index, state) {
        model.states[state].isAccept = true;
      });
      return model;
    },
    
    deserialize: function(model) {
      afd.deserialize(model.afd);
    }
  };
}()).init();
