var fsm = (function() {
	var self = null;
	var delegate = null;
	var container = null;
	var stateCounter = 0;
	var saveLoadDialog = null;

	var localStorageAvailable = function () {
		return (typeof Storage !== "undefined"  && typeof localStorage !== "undefined");
	};

	var refreshLocalStorageInfo = function() {
		if (localStorageAvailable()) {
			$('#storedMachines').empty();
			var keys = [];
			for (var i=0; i < localStorage.length; ++i) {
				keys.push(localStorage.key(i));
			}
			keys.sort();
			$.each(keys, function(idx, key) {
				$('<li></li>', {'class':'machineName'})
					.append($('<span></span>').html(key))
					.append('<div class="delete" style="display:none;" title="Excluir"><img class="delete" src="images/empty.png" /></div>')
					.appendTo('#storedMachines');
			});
		}
	};

	var makeSaveLoadDialog = function() {
		saveLoadDialog = $('#saveLoadDialog');
		$('#saveLoadTabs').tabs();
		$('#saveLoadTabs textarea').height(275);
		if (!localStorageAvailable()) {
			$('#saveLoadTabs')
				.tabs('option', 'active', 1)
				.tabs('option', 'disabled', [0])
				.find('ul li').eq(0).attr('title', 'Browser não suporta');
		}
		saveLoadDialog.dialog({
			autoOpen: false,
			dialogClass: 'loadSave no-close',
			width: 500,
			height: 450,
			open: function() {
				
				saveLoadDialog.find("div.ui-tabs-panel:not(.ui-tabs-hide)").find('input, textarea').focus();
			}
		});

		
		$('#machineName').focus(function() {if ($(this).val() === $(this).attr('title')) {$(this).val('');}})
			.blur(function() {if($(this).val() === '') {$(this).val($(this).attr('title'));}})
			.keyup(function(event) {
				if (event.which === $.ui.keyCode.ENTER) {
					saveLoadDialog.parent().find('.ui-dialog-buttonpane button').eq(-1).trigger('click');
			}});

		$('#storedMachines').on('mouseover', 'li.machineName', function(event) {
			$(this).find('div.delete').show();
		}).on('mouseout', 'li.machineName', function(event) {
			$(this).find('div.delete').hide();
		}).on('click', 'li.machineName div.delete', function(event) {
			event.stopPropagation();
			localStorage.removeItem($(this).closest('li.machineName').find('span').html());
			refreshLocalStorageInfo();
		}).on('click', 'li.machineName', function(event) { 
			$('#machineName').val($(this).find('span').html()).focus();
		}).on('dblclick', 'li.machineName', function(event) {	
			$('#machineName').val($(this).find('span').html());
			saveLoadDialog.parent().find('.ui-dialog-buttonpane button').eq(-1).trigger('click');
		});
	};

//iniciar o jsplumb
	var initJsPlumb = function() {
		jsPlumb.importDefaults({
			Anchors: ["Continuous", "Continuous"],
			ConnectorZIndex: 5,
			ConnectionsDetachable: false,
			Endpoint: ["Dot", {radius:2}],
			HoverPaintStyle: {strokeStyle:"#d44", lineWidth:2},
			ConnectionOverlays: [
				["Arrow", {
					location: 1,
					length: 14,
					foldback: 0.8
					}],
				["Label", {location:0.5}]
			],
			Connector: ["StateMachine", {curviness:20}],
			PaintStyle: {strokeStyle:'#0dd', lineWidth:2}
		});

		jsPlumb.bind("click", connectionClicked);
	};

	var initStateEvents = function() {
		//Configuração para manipular o botao de deletar
		container.on('mouseover', 'div.state', function(event) {
			$(this).find('div.delete').show();
		}).on('mouseout', 'div.state', function(event) {
			$(this).find('div.delete').hide();
		});
		container.on('click', 'div.delete', function(event) {
			self.removeState($(this).closest('div.state'));
		});

		/// Configuração para mudanças de estado de aceitação
		container.on('change', 'input[type="checkbox"].isAccept', function(event) {
			var cBox = $(this);
			var stateId = cBox.closest('div.state').attr('id');
			if (cBox.prop('checked')) {
				delegate.fsm().addAcceptState(stateId);
			} else {
				delegate.fsm().removeAcceptState(stateId);
			}
		});
	};

	var initFSMSelectors = function() {
		$('button.delegate').on('click', function() {
			var newDelegate = null;
			switch ($(this).html()) {
				case 'AFD': newDelegate = afd_delegate; break;
				case 'AFND': newDelegate = afnd_delegate; break;
			}
			if (newDelegate !== delegate) {
				self.setDelegate(newDelegate);
				$('button.delegate').prop('disabled', false);
				$(this).prop('disabled', true);
			}
		});

		$('button.delegate').each(function() {
			if ($(this).html() === 'AFD') { 
				$(this).click();
			}
		});
	};

	var loadSerializedFSM = function(serializedFSM) {
		var model = serializedFSM;
		if (typeof serializedFSM === 'string') {
			model = JSON.parse(serializedFSM);
		}

		self.reset();
		$('button.delegate').each(function() {
			if ($(this).html() === model.type) {
				$(this).click();
			}
		});

		$('#acceptStrings').val(model.bulkTests.accept);
		$('#rejectStrings').val(model.bulkTests.reject);

		// Criar estados
		$.each(model.states, function(stateId, data) {
			var state = null;
			if (stateId !== 'inicio') {
				state = makeState(stateId)
					.css('left', data.left + 'px')
					.css('top', data.top + 'px')
					.appendTo(container);
				jsPlumb.draggable(state, {containment:"parent"});
				makeStatePlumbing(state);
			} else {
				state = $('#inicio');
			}
			if (data.isAccept) {state.find('input.isAccept').prop('checked', true);}
		});

		// Criar transições
		jsPlumb.unbind("jsPlumbConnection"); 
		$.each(model.transitions, function(index, transition) {
			jsPlumb.connect({source:transition.stateA, target:transition.stateB}).setLabel(transition.label);
		});
		jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded);

		delegate.deserialize(model);
	};

	var updateStatusUI = function(status) {
		$('#fsmDebugInputStatus span.consumedInput').html(status.input.substring(0, status.inputIndex));
		if (status.nextChar === '') {
			$('#fsmDebugInputStatus span.currentInput').html(delegate.getEmptyLabel());
			$('#fsmDebugInputStatus span.futureInput').html(status.input.substring(status.inputIndex));
		} else if (status.nextChar === null) {
			$('#fsmDebugInputStatus span.currentInput').html('[Fim]');
			$('#fsmDebugInputStatus span.futureInput').html('');
		} else {
			$('#fsmDebugInputStatus span.currentInput').html(status.input.substr(status.inputIndex, 1));
			$('#fsmDebugInputStatus span.futureInput').html(status.input.substring(status.inputIndex+1));
		}

	};

	var connectionClicked = function(connection) {
		delegate.connectionClicked(connection);
	};

	var checkHashForModel = function() {
		var hash = window.location.hash;
		hash = hash.replace('#', '');
		hash = decodeURIComponent(hash);
		if (hash) {loadSerializedFSM(hash);}
	};

	var domReadyInit = function() {
		self.setGraphContainer($('#machineGraph'));

		$(window).resize(function() {
			container.height($(window).height() - $('#mainHolder h1').outerHeight() - $('#footer').outerHeight() - $('#bulkResultHeader').outerHeight() - $('#resultConsole').outerHeight() - 30 + 'px');
			jsPlumb.repaintEverything();
		});
		$(window).resize();

		$('#testString').keyup(function(event) {if (event.which === $.ui.keyCode.ENTER) {$('#testBtn').trigger('click');}});

		container.dblclick(function(event) {
			self.addState({top: event.offsetY, left: event.offsetX});
		});

		initJsPlumb();
		initStateEvents();
		initFSMSelectors();
		makeSaveLoadDialog();


		checkHashForModel();
	};

	var makeStartState = function() {
		var startState = makeState('inicio');
		startState.find('div.delete').remove(); // Não pode deletar inicial
		container.append(startState);
		makeStatePlumbing(startState);
	};

	var makeState = function(stateId) {
		return $('<div id="' + stateId + '" class="state"></div>')
			.append('<input id="' + stateId+'_isAccept' + '" type="checkbox" class="isAccept" value="true" title="Final" />')
			.append(stateId)
			.append('<div class="plumbSource" title="Arraste daqui para criar nova transição">&nbsp;</div>')
			.append('<div class="delete" style="display:none;" title="Excluir"><img class="delete" src="images/empty.png" /></div>');
	};

	var makeStatePlumbing = function(state) {
		var source = state.find('.plumbSource');
		jsPlumb.makeSource(source, {
			parent: state,
			maxConnections: 10,
			onMaxConnections:function(info, e) {
				alert("Maximo de (" + info.maxConnections + ") conexões");
			},
		});

		jsPlumb.makeTarget(state, {
			dropOptions: {hoverClass:'dragHover'}
		});
		return state;
	};

	return {
		init: function() {
			self = this;
			$(domReadyInit);
			return self;
		},

		setDelegate: function(newDelegate) {
			delegate = newDelegate;
			delegate.setContainer(container);
			delegate.reset().fsm().setStartState('inicio');
			jsPlumb.unbind("jsPlumbConnection");
			jsPlumb.reset();
			container.empty();
			initJsPlumb();
			jsPlumb.bind("jsPlumbConnection", delegate.connectionAdded);
			stateCounter = 0;
			makeStartState();
			return self;
		},

		setGraphContainer: function(newContainer) {
			container = newContainer;
			jsPlumb.Defaults.Container = container;
			return self;
		},

		addState: function(location) {
			while ($('#q'+stateCounter).length > 0) {++stateCounter;} // previnir estados duplicados
			var state = makeState('q' + stateCounter);
			if (location && location.left && location.top) {
				state.css('left', location.left + 'px')
				.css('top', location.top + 'px');
			}
			container.append(state);
			jsPlumb.draggable(state, {containment:"parent"});
			makeStatePlumbing(state);
			return self;
		},

		removeState: function(state) {
			var stateId = state.attr('id');
			jsPlumb.select({source:stateId}).detach(); // remover todas as conexoes
			jsPlumb.select({target:stateId}).detach();
			state.remove(); 
			delegate.fsm().removeTransitions(stateId); // remover transiçoes
			delegate.fsm().removeAcceptState(stateId); 
			return self;
		},

		removeConnection: function(connection) {
			jsPlumb.detach(connection);
		},

		test: function(input) {
			if ($.type(input) === 'string') {
				$('#testResult').html('Testando...')
				var accepts = delegate.fsm().accepts(input);
				$('#testResult').html(accepts ? 'Aceito' : 'Rejeitado').effect('highlight', {color: accepts ? '#bfb' : '#fbb'}, 1000);
			} else {
				$('#resultConsole').empty();
				var makePendingEntry = function(input, type) {
						return $('<div></div>', {'class':'pending', title:'Pending'}).append(type + ' ' + (input === '' ? '[vazio]' : input)).appendTo('#resultConsole');
				};
				var updateEntry = function(result, entry) {
					entry.removeClass('pending').addClass(result).attr('title', result).append(' --> ' + result);
				};
				$.each(input.accept, function(index, string) {
					updateEntry((delegate.fsm().accepts(string) ? 'Passou' : 'Falhou'), makePendingEntry(string, ''));
				});
				
				$('#bulkResultHeader').effect('highlight', {color: '#add'}, 1000);
			}
			return self;
		},

		debug: function(input) {
			if ($('#stopBtn').prop('disabled')) {
				$('#testResult').html('&nbsp;');
				$('#stopBtn').prop('disabled', false);
				$('#loadBtn, #testBtn, #bulkTestBtn, #testString, #resetBtn').prop('disabled', true);
				$('button.delegate').prop('disabled', true);
				$('#fsmDebugInputStatus').show();
				delegate.debugStart();
				delegate.fsm().stepInit(input);
			} else {
				delegate.fsm().step();
			}
			var status = delegate.fsm().status();
			updateStatusUI(status);
			delegate.updateUI();
			if (status.status !== 'Active') {
				$('#testResult').html(status.status === 'Accept' ? 'Aceito' : 'Rejeitado').effect('highlight', {color: status.status === 'Accept' ? '#bfb' : '#fbb'}, 1000);
				$('#debugBtn').prop('disabled', true);
			}
			return self;
		},

		debugStop: function() {
			$('#fsmDebugInputStatus').hide();
			$('#stopBtn').prop('disabled', true);
			$('#loadBtn, #testBtn, #bulkTestBtn, #debugBtn, #testString, #resetBtn').prop('disabled', false);
			$('button.delegate').prop('disabled', false).each(function() {
				switch ($(this).html()) {
					case 'AFD': if (delegate === afd_delegate) {$(this).prop('disabled', true);} break;
					case 'AFND': if (delegate === afnd_delegate) {$(this).prop('disabled', true);} break;
				}
			});
			delegate.debugStop();
			return self;
		},

		reset: function() {
			self.setDelegate(delegate);
			$('#testString').val('');
			$('#testResult').html('&nbsp;');
			$('#acceptStrings').val('');
			$('#rejectStrings').val('');
			$('#resultConsole').empty();
			return self;
		},
	};
})().init();


/******************************************************************************/
$(document).ready(function() {

//seleciona os elementos a com atributo name="modal"
$('a[name=modal]').click(function(e) {
//cancela o comportamento padrão do link
e.preventDefault();

//armazena o atributo href do link
var id = $(this).attr('href');

//armazena a largura e a altura da tela
var maskHeight = $(document).height();
var maskWidth = $(window).width();

//Define largura e altura do div#mask iguais ás dimensões da tela
$('#mask').css({'width':maskWidth,'height':maskHeight});

//efeito de transição
$('#mask').fadeIn(1000);
$('#mask').fadeTo("slow",0.8);

//armazena a largura e a altura da janela
var winH = $(window).height();
var winW = $(window).width();
//centraliza na tela a janela popup
$(id).css('top',  winH/2-$(id).height()/2);
$(id).css('left', winW/2-$(id).width()/2);
//efeito de transição
$(id).fadeIn(2000);
});

//se o botãoo fechar for clicado
$('.window .close').click(function (e) {
//cancela o comportamento padrão do link
e.preventDefault();
$('#mask, .window').hide();
});

//se div#mask for clicado
$('#mask').click(function () {
$(this).hide();
$('.window').hide();
});
});
