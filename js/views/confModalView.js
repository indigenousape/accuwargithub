 /*
 	[accuwar]: Turn-based Strategy Game
	Confirmation Dialog Modal View
*/ 

App.Views.ConfModal = Backbone.View.extend({
	template: App.Utilities.template('confModal'),
	initialize: function() {
		var thisView = this;
		$('#modalLiveRegion').html('');
		this.render();
		$('#modalTarget').html(this.$el);
		$('#oneModal .modal-dialog').removeClass('modal-lg');
		App.Utilities.showModal();

		$('#oneModal').on('shown.bs.modal', function(e) {
			
			if($('.modal-footer .btn-primary').length > 0 && !App.Utilities.smallScreenOnly()) {
				$('.modal-footer .btn-primary').focus();
			} else if (!App.Utilities.smallScreenOnly()) {
				$('.modal-footer .btn-danger').focus();
			}

			App.Views.battleMap.smoothScroll('.terr:first-child');
		
		});

	 	$('#oneModal').on('hidden.bs.modal', function() {

 			App.Utilities.console("Before");
	 		App.Utilities.console($._data( $("#oneModal")[0], "events" ));

	 		$('#oneModal').off();
			thisView.closeView();

 			App.Utilities.console("After");
 			App.Utilities.console($._data( $("#oneModal")[0], "events" ));
	 	
	 	});

	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},
	events: {
		'click #trainTerrArmyXP' : 'trainTheArmy',
		'click #repairAllFortStr' : 'repairAllForts',
		'click #rebuildInfrastructure': 'rebuildTheInfrastructure',
		'click #upgradeTerrFortLevel' : 'updateTheFortLevel',
		'click #repairTerrFort': 'repairTheFort',
		'click #upgradeTerrEcon': 'upgradeTheEconomy',
		'click #confAttack' : 'attackTheTerritory',
		'click #confNewGame' : 'restartTheGame',
		'click #confNewTurn' : 'endTheTurn',
		'click #invasionStep' : 'invadeTheTerritory',
		'click #repairAllInfrastructure' : 'rebuildAllInfrastructure',
		'click #getScore' : 'getFinalScore',
		'click .current' : 'currentClick',
		'click .previous' : 'mouseOutBar',
		'mouseover .fort-label' : 'mouseOverBar',
		'mouseout .fort-label' : 'mouseOutBar',
		'focusin .fort-label' : 'mouseOverBar',
		'focusout .fort-label' : 'mouseOutBar',
		'click #battleNot' : 'battleNotification',
		'click #confUpdatePolicy' : 'confUpdatePolicy',
		'change .available-policies' : 'toggleEnactPolicy'
	},
	attackTheTerritory: function() {

		if(App.Views.clickedTerrView.model.get('inRange') && !this.model.get('stopClick')) {
			App.Views.battleMap.battle(App.Models.selectedTerrModel, App.Models.clickedTerrModel);
			$(".modal-footer .btn-danger").focus();
			App.Views.battleMap.smoothScroll('.modal-header');
			this.model.set('stopClick', true);
		}

	},
	battleNotification: function() { 

		if(this.model.get('govKilled')) {
			App.Views.battleMap.notify({
				icon: 'glyphicon glyphicon-globe',
				titleTxt : "Governor of " + App.Models.clickedTerrModel.get('name') + " Killed",
				msgTxt : "Flags lowered as citizens gather to pay respects for local&nbsp;leader.",
				msgType: "success"
			});
		}
		App.Views.battleMap.notify(this.model.get('notification'));
		App.Views.battleMap.deselect();
		App.Utilities.warpEls(['.treasury-tot', '.changeTax']);
	},
	closeView: function() {
		$('#oneModal, #oneModal .fort-label').off();
    	this.unbind();
    	this.undelegateEvents();
    	this.remove();
    	$('#oneModal .modal-dialog').removeClass('modal-lg');
    	App.Views.battleMap.smoothScroll('.terr:first-child');
	},
	toggleEnactPolicy: function(e) {
		var policyID = e.currentTarget.value;
		var polArr = _.where(App.Models.nationStats.get(App.Utilities.activeSide()).get('activePolicies'), {side: App.Utilities.activeSide()});
		var clickedPolIndexInSidePolicies = _.pluck(polArr, 'id');
		var indexInSidePolicies = _.indexOf(clickedPolIndexInSidePolicies, policyID);
		
		polArr[indexInSidePolicies].priority = e.currentTarget.checked ? (App.Models.nationStats.get(App.Utilities.activeSide()).get('activePolicyCount') + 1) : 0;

		if(App.Models.nationStats.get(App.Utilities.activeSide()).get('activePolicyCount') > 1
			&& !e.currentTarget.checked
			&& indexInSidePolicies < polArr.length - 1) {
			
			for(var i = 0; i < ((polArr.length - 1) - indexInSidePolicies); i++ ) {
				polArr[indexInSidePolicies + (i + 1)].priority = polArr[indexInSidePolicies + (i + 1)].priority - 1;
			}
		
		}

		if(policyID === 'recruit_army') {
			polArr[indexInSidePolicies].amount = 25000;
		}

		polArr = _.sortBy(polArr, 'priority');

		var activeCount = e.currentTarget.checked ? App.Models.nationStats.get(App.Utilities.activeSide()).get('activePolicyCount') + 1 : App.Models.nationStats.get(App.Utilities.activeSide()).get('activePolicyCount') - 1;

		App.Models.nationStats.get(App.Utilities.activeSide()).set('activePolicies', polArr);
		App.Models.nationStats.get(App.Utilities.activeSide()).set('activePolicyCount', activeCount);

		// Logging
		App.Utilities.console(App.Utilities.activeSide() + ' side policies: ');
		App.Utilities.console(App.Models.nationStats.get(App.Utilities.activeSide()).get('activePolicies'));
		var enemySide = App.Utilities.activeSide() === 'left' ? 'right' : 'left';
		App.Utilities.console(enemySide + ' side policies: ');
		App.Utilities.console(App.Models.nationStats.get(enemySide).get('activePolicies'));

	},
	confUpdatePolicy: function() {
		if(!this.model.get('stopClick')) {

			if(App.Models.nationStats.get(App.Utilities.activeSide()).changedAttributes().activePolicyCount != undefined) {
				App.Views.battleMap.notify({
					icon: "glyphicon glyphicon-globe",
					titleTxt : "Polices Updated in&nbsp;" + App.Utilities.getActiveEmpireName(),
					msgType: 'left'
				});
			}
			this.model.set('stopClick', true);
		}
	},
	endTheTurn: function() {
		if(!this.model.get('stopClick')) {
			App.Views.battleMap.deselect();
			App.Views.nationStatsView.updater();
			this.model.set('stopClick', true);
		}
	},
	getFinalScore: function() {

		var winningSide = App.Utilities.activeSide();
		var winningSideModel = App.Models.nationStats.get(winningSide);
		var enemySide = winningSide === 'left' ? 'right' : 'left';
		var enemySideModel = App.Models.nationStats.get(enemySide);

		var winnerScore = App.Utilities.computeScore(winningSide);

		var detailsHTML = '<h3>Battle Record <span>(' + winningSideModel.get('overallBattleWins') + ' - ' + winningSideModel.get('overallBattleLosses') +')</span></h3>'
						+ '<div class="row"><div class="col-xs-12 col-sm-6"><p class="battle-stats-label">Enemy Kills</p>'
						+	'<ul class="side-list">';

		var displayEnemyArmyKilled = App.Utilities.addCommas(enemySideModel.get('overallArmyCasualties') + App.Collections.terrCollection.getSideCasualties(enemySide, 'army'));
		detailsHTML += '<li>Army: ' + displayEnemyArmyKilled + ' units</li>';
	
		if(enemySideModel.get('overallEconCasualties') + App.Collections.terrCollection.getSideCasualties(enemySide, 'econ') > 0) {
			var displayEnemyEconKilled = App.Utilities.addCommas(enemySideModel.get('overallEconCasualties') + App.Collections.terrCollection.getSideCasualties(enemySide, 'econ'));
			detailsHTML += '<li>Civilians: ' + displayEnemyEconKilled + '</li>';
		}

		detailsHTML += '</ul></div>'
					+	'<div class="col-xs-12 col-sm-6"><p class="battle-stats-label">Casualties</p>'
					+		'<ul class="side-list">';
		
		var displayArmyCas = App.Utilities.addCommas(winningSideModel.get('overallArmyCasualties') + App.Collections.terrCollection.getSideCasualties(winningSide, 'army'));
		detailsHTML += '<li>Army: ' + displayArmyCas + ' units</li>';

		if(winningSideModel.get('overallEconCasualties') + App.Collections.terrCollection.getSideCasualties(winningSide, 'econ') > 0) {
			var displayEconCasualties = App.Utilities.addCommas(winningSideModel.get('overallEconCasualties') + App.Collections.terrCollection.getSideCasualties(winningSide, 'econ'));
			detailsHTML += '<li>Civilians: ' + displayEconCasualties + '</li>';
		}

		detailsHTML += '</ul></div></div><div class="clearfix"></div>'
					+ '<div class="row"><div class="col-xs-12 col-sm-6"><h3>Empire</h3>'
					+		'<ul class="side-list">';

		detailsHTML += '<li>Territories: ' + winningSideModel.get('terrs').length + '</li>';

		var displayTreasury = App.Utilities.addCommas(winningSideModel.get('treasury'));
		detailsHTML += '<li>Treasury: $' + displayTreasury + '</li>';

		var displayGDP = App.Utilities.addCommas(winningSideModel.get('econOutput'));
		detailsHTML += '<li>GDP: $' + displayGDP + '</li>';

		var displayEconPopulation = App.Utilities.addCommas(App.Collections.terrCollection.returnSideTotal(winningSide, 'econPopulation'));
		detailsHTML += '<li>Population: ' + displayEconPopulation + '</li>';

		var displayArmyUnits = App.Utilities.addCommas(App.Collections.terrCollection.returnSideTotal(winningSide, 'armyPopulation'));
		detailsHTML += '<li>Army: ' + displayArmyUnits + ' units</li>'
					+ '</ul></div>';


		detailsHTML += '<div class="col-xs-12 col-sm-6"><h3>Achievements</h3>'
					+		'<ul class="side-list special-list">';

		detailsHTML += '<li><span class="glyphicon glyphicon-signal" aria-hidden="true"></span> ' + parseInt(winningSideModel.get('armyTechLvl')) + ' Average Tech Level </li>';

		if (winningSideModel.get('invadedThisTurn').length + winningSideModel.get('overallInvasions') > 0) {
			var terrTxt = winningSideModel.get('invadedThisTurn').length + winningSideModel.get('overallInvasions') === 1 ? 'Territory' : 'Territories';
			detailsHTML += '<li><span class="glyphicon glyphicon-bookmark" aria-hidden="true"></span> ' + parseInt(winningSideModel.get('invadedThisTurn').length + winningSideModel.get('overallInvasions')) + 'x ' + terrTxt + ' Invaded </li>';
		}

		if (winningSideModel.get('terrLostThisTurn').length + winningSideModel.get('overallLostTerrs') > 0) { 
			var terrTxt = winningSideModel.get('terrLostThisTurn').length + winningSideModel.get('overallLostTerrs') === 1 ? 'Territory' : 'Territories';
			detailsHTML += '<li><span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span> ' + parseInt(winningSideModel.get('terrLostThisTurn').length + winningSideModel.get('overallLostTerrs')) + 'x ' + terrTxt + ' Lost </li>';
		}

		if (winningSideModel.get('recruitsThisTurn') + winningSideModel.get('overallRecruits') > 0) {
			detailsHTML += '<li><span class="glyphicon glyphicon-user" aria-hidden="true"></span> ' + App.Utilities.addCommas(parseInt(winningSideModel.get('recruitsThisTurn') + winningSideModel.get('overallRecruits'))) + ' Recruits</li>';
		}

		if (winningSideModel.get('armiesPromoted').length + winningSideModel.get('overallArmyPromotions') > 0) {
			var promTxt = winningSideModel.get('armiesPromoted').length + winningSideModel.get('overallArmyPromotions') === 1 ? 'Promotion' : 'Promotions';
			detailsHTML += '<li><span class="glyphicon glyphicon-star" aria-hidden="true"></span> ' + parseInt(winningSideModel.get('armiesPromoted').length + winningSideModel.get('overallArmyPromotions')) + 'x Army ' + promTxt + '</li>';
		}

		if (enemySideModel.get('fortsLost').length + winningSideModel.get('overallFortsDestroyed') > 0) {
			var fortTxt = enemySideModel.get('fortsLost').length + winningSideModel.get('overallFortsDestroyed') === 1 ? 'Fort' : 'Forts';
			detailsHTML += '<li><span class="glyphicon glyphicon-fire" aria-hidden="true"></span> ' + parseInt(enemySideModel.get('fortsLost').length + winningSideModel.get('overallFortsDestroyed')) + 'x ' + fortTxt + ' Destroyed</li>';
		}

		if (winningSideModel.get('fortsLost').length + winningSideModel.get('overallFortsLost') > 0) {
			var fortTxt = winningSideModel.get('fortsLost').length + winningSideModel.get('overallFortsLost') === 1 ? 'Fort' : 'Forts';
			detailsHTML += '<li><span class="glyphicon glyphicon-fire" aria-hidden="true"></span> ' + parseInt(winningSideModel.get('fortsLost').length + winningSideModel.get('overallFortsLost')) + 'x ' + fortTxt + ' Lost</li>';
		}

		detailsHTML += '</ul></div></div><div class="clearfix"></div>';

		// Starting at zero to animate up to the final score (stored as data on #finalScore)
		var rankHTML = App.Utilities.makeFinalScoreStars(0);

		var messageHTML = '<div><h3 class="final-rank pull-right">' + rankHTML + '</h3><h2>Final Score: <span id="finalScore" data-final-score="' + winnerScore.total + '">' + App.Utilities.addCommas(winnerScore.total) + '</span></h2></div>' + detailsHTML;

		var confModalModel = new App.Models.Modal({
			title: 'Winner: ' + App.Utilities.getActiveEmpireName(),
			confBtnId: 'confNewGame',
			confBtnTxt: 'Restart Game',
			modalMsg: messageHTML,
			confBtnClass: 'btn-danger',
			showCancelBtn: false
		});

		var confModalView = new App.Views.ConfModal({model: confModalModel});
		// Animate the score total
	    $('#finalScore').prop('Counter',0).animate({
	        Counter: $('#finalScore').attr('data-final-score')
	    }, {
	        duration: 2000,
	        easing: 'swing',
	        step: function (now) {
	            $('#finalScore').text(App.Utilities.addCommas(Math.ceil(now)));
	            $('.final-rank').html(App.Utilities.makeFinalScoreStars(Math.ceil(now)));
	        }
	    });


	},
	invadeTheTerritory: function() {
		if(!this.model.get('stopClick')) {
			App.Views.selectedTerrView.invadeTerr(App.Models.selectedTerrModel, App.Models.clickedTerrModel, this.model.get('newObj'));
			this.model.set('stopClick', true);
		}
	},
	currentClick : function(e) {

		$.each($('.previous'), function() {
			this.click();
		});

		this.mouseOverBar(e);

	},
	mouseOutBar: function(e) {

		// App.Utilities.console(e.type);

		if(!App.Utilities.smallScreenOnly() || e.type === 'click' || (App.Utilities.smallScreenOnly() && e.type === 'mouseout')) {
			var thisEl = e.currentTarget;
			if(this.model.get('animationOver')) {
				$(thisEl).addClass('current').removeClass('previous');
				$(thisEl.firstChild).css('width', $(thisEl.firstChild).data('endVal') + '%');
				$(thisEl).find('.prog-bar-text-val').text($(thisEl).find('.prog-bar-text-val').data('endVal'));
			}
		}

	},
	mouseOverBar: function(e) {

		// App.Utilities.console(e.type);

		if(!App.Utilities.smallScreenOnly() || e.type === 'click') {

			var thisEl = e.currentTarget;
			if(this.model.get('animationOver')) {
				$(thisEl).addClass('previous').removeClass('current');
				$(thisEl.firstChild).css('width', $(thisEl.firstChild).data('startVal') + '%');
				$(thisEl).find('.prog-bar-text-val').text($(thisEl).find('.prog-bar-text-val').data('startVal'));
			}

		}

	},
	rebuildTheInfrastructure: function() {

		if(!this.model.get('stopClick')) {

			var cost = this.model.get('diffToNext'),
				treasury = App.Utilities.getTreasury() - cost,
				diff = 100 - App.Models.selectedTerrModel.get('econStrength'),
				newSideInfraspend = App.Models.nationStats.get(App.Utilities.activeSide()).get('infrastructureSpend');

			App.Utilities.upgradeTerrEconStr();
			App.Utilities.flipEls(['.econStrength-bar', '.econMorale-bar', '.econMorale-bar', '.economicOutput-bar']);
			App.Models.nationStats.get(App.Utilities.activeSide()).set('repairAllInfrastructureCost', App.Collections.terrCollection.returnTotalCost('econStrength'));
			App.Models.nationStats.payForUpgrade(treasury);
			App.Models.nationStats.get(App.Utilities.activeSide()).set('infrastructureSpend', (newSideInfraspend + cost));
			App.Utilities.displayInRange();
			App.Utilities.setClickedTreasuryLimits();

			var infraMsgsArr = [
					['Traffic flowing', _.random(Math.round(diff/2), diff), 'more smoothly through'],
					['Highways re-open in', diff, 'of'],
					['Commute times down',  _.random(Math.round(diff/2), diff), 'in'],
					['Army surveyors declare', 100, 'of roads passable in']
				],
				msgArrNum = _.random(0, infraMsgsArr.length - 1);

			App.Views.battleMap.notify({
				icon: "glyphicon glyphicon-wrench",
				titleTxt: "Infrastructure Repaired",
				msgTxt : infraMsgsArr[msgArrNum][0] +" "+infraMsgsArr[msgArrNum][1]+"% "+infraMsgsArr[msgArrNum][2]+" "+ App.Models.selectedTerrModel.get('name') +" after completion of $" + App.Utilities.addCommas(cost) + " reconstruction&nbsp;project.",
				msgType: 'left'
			});

			this.model.set('stopClick', true);
		}

	},
	rebuildAllInfrastructure: function() {

		if(!this.model.get('stopClick')) {

			var cost = App.Collections.terrCollection.returnTotalCost('econStrength'),
				treasury = App.Utilities.getTreasury() - cost,
				newSideInfraspend = App.Models.nationStats.get(App.Utilities.activeSide()).get('infrastructureSpend');

			App.Collections.terrCollection.repairAllInfrastructure();
			App.Models.nationStats.get(App.Utilities.activeSide()).set('repairAllInfrastructureCost', 0);
			App.Models.nationStats.payForUpgrade(treasury);
			App.Models.nationStats.get(App.Utilities.activeSide()).set('infrastructureSpend', (newSideInfraspend + cost));
			
			if(App.Models.battleMapModel.get('selectedMode')) {
				App.Utilities.flipEls(['.econStrength-bar', '.econMorale-bar', '.econMorale-bar', '.economicOutput-bar']);
				App.Utilities.displayInRange();
			}

			var minNum = Math.round(cost / App.Constants.ECON_STR_COST / App.Models.nationStats.get(App.Utilities.activeSide()).get('terrs').length * 10);

			var allInfraMsgsArr = [
					['Traffic flowing', _.random(Math.round(minNum/2), minNum), 'more smoothly through'],
					['Highways re-open in', minNum, 'of'],
					['Commute times down',  _.random(Math.round(minNum/2), minNum), 'in'],
					['Army engineers report', 100, 'of roads clear for unit movements across']
				],
				allMsgArrNum = _.random(0, allInfraMsgsArr.length - 1);

			App.Views.battleMap.notify({
				icon: "glyphicon glyphicon-wrench",
				titleTxt : "Infrastructure Repaired",
				msgTxt: allInfraMsgsArr[allMsgArrNum][0] +" "+allInfraMsgsArr[allMsgArrNum][1]+"% "+allInfraMsgsArr[allMsgArrNum][2]+" "+ App.Utilities.getActiveEmpireName() +" after completion of $" + App.Utilities.addCommas(cost) + " national reconstruction&nbsp;project.",
				msgType: 'left'
			});

			this.model.set('stopClick', true);

		}

	},
	restartTheGame: function() {

		if(!this.model.get('stopClick')) {
			App.Utilities.setNextTrack();
			$('#ambientMusic')[0].pause();
			$('#ambientMusic').off();
			$('#ambientMusic').bind('ended', App.Utilities.playNextTrack);

			App.Utilities.removeClassName(['selected', 'selectedSection']);
			App.Models.battleMapModel = new App.Models.BattleZone();
			App.Views.battleMap = new App.Views.BattleZone({model: App.Models.battleMapModel});
			$('#game').html(App.Views.battleMap.$el);
			$('#game').removeClass('fadein');
			$('.army, #sidebar-main-trigger, #sidebar-secondary-trigger, .changeTax, newTurn, .sideName').attr('tabindex', -1);
			$('body').prepend($('<div id="setup"></div>'));

			var LeftModel = new Emp({
				armyPopulationStart: App.Constants.START_ARMY_UNITS,
				color: 'blue'
			});
			        	
			var RightModel = new Emp({
				armyPopulationStart: App.Constants.START_ARMY_UNITS,
				color: 'orange'
			});
			App.Models.nationStats = new App.Models.NationStats({
				'left' : LeftModel,
				'right' : RightModel
			});
			App.Views.nationStatsView = new App.Views.NationStats({model: App.Models.nationStats});
			App.Collections.terrCollection = new App.Collections.Territories();
			App.Utilities.makeTerritories();
			App.Views.gameStartView = new App.Views.GameStart({model: App.Models.gameStartModel});
			$('#setup').html(App.Views.gameStartView.$el);
			App.Views.p1ColorView = new App.Views.ColorView({model: App.Models.gameStartModel});
			App.Views.p2ColorView = new App.Views.RightColorView({model: App.Models.gameStartModel});
			$('#p1ColorMenu').html(App.Views.p1ColorView.$el);
			$('#p2ColorMenu').html(App.Views.p2ColorView.$el);

			this.model.set('stopClick', true);

		}

	},
	repairTheFort: function() {

		if(!this.model.get('stopClick')) {

			var treasury = App.Utilities.getTreasury() - this.model.get('diffToNext'),
				newSideFortspend = App.Models.nationStats.get(App.Utilities.activeSide()).get('fortSpend');

			App.Views.battleMap.notify({
				titleTxt : "+" + (100 - App.Models.selectedTerrModel.get('fortStrength')) + "% Fort Strength",
				msgTxt : "Spirits lifted by $" + App.Utilities.addCommas(this.model.get('diffToNext')) + " investment in repairs at Fort&nbsp;" + App.Models.selectedTerrModel.get('name') + ".",
				msgType:'success'
			});

			App.Utilities.repairTerrFortStr();
			App.Models.nationStats.payForUpgrade(treasury);
			App.Models.nationStats.get(App.Utilities.activeSide()).set('fortSpend', (newSideFortspend + this.model.get('diffToNext')));
			App.Utilities.displayInRange();
			App.Utilities.flipEls(['.econMorale-bar', '.econMorale-bar', '.fortStrength-main', '.economicOutput-bar']);

			this.model.set('stopClick', true);

		}

	},
	repairAllForts: function() {

		if(!this.model.get('stopClick')) {

			var cost = App.Collections.terrCollection.returnTotalCost('fortStrength'),
				treasury = App.Utilities.getTreasury() - cost,
				newSideFortspend = App.Models.nationStats.get(App.Utilities.activeSide()).get('fortSpend');

			App.Collections.terrCollection.repairAllForts();
			
			if(App.Models.battleMapModel.get('selectedMode')) {
				App.Utilities.displayInRange();
				App.Utilities.flipEls(['.econMorale-bar', '.econMorale-bar', '.fortStrength-main', '.economicOutput-bar']);
			}

			App.Models.nationStats.payForUpgrade(treasury);
			App.Models.nationStats.get(App.Utilities.activeSide()).set({
				'fortSpend': (newSideFortspend + cost),
				'repairAllFortCost' : 0
			});

			App.Views.battleMap.notify({
				icon: "glyphicon glyphicon-wrench",
				titleTxt : "All Forts Repaired in&nbsp;" + App.Utilities.getActiveEmpireName(),
				msgTxt: "Cost: $" + App.Utilities.addCommas(cost),
				msgType: 'left'
			});

			this.model.set('stopClick', true);

		}

	},
	trainTheArmy: function() {

		if(!this.model.get('stopClick')) {

			var treasury = App.Utilities.getTreasury() - this.model.get('diffToNext')
				startXP = App.Models.selectedTerrModel.get('armyXP'),
				newSideTrainingspend = App.Models.nationStats.get(App.Utilities.activeSide()).get('armyTrainingSpend');

			App.Models.nationStats.payForUpgrade(treasury);
			App.Models.nationStats.get(App.Utilities.activeSide()).set('armyTrainingSpend', (newSideTrainingspend + this.model.get('diffToNext')));
			App.Utilities.trainTerrArmy();


			App.Views.battleMap.notify({
				titleTxt : "+" + (App.Models.selectedTerrModel.get('armyXP') - startXP) + " Army XP in&nbsp;" + App.Models.selectedTerrModel.get('name'),
				msgType:'success',
				delay: App.Constants.DELAY_SHORTEST,
				icon: 'glyphicon glyphicon-signal'
			});

			App.Views.battleMap.deselect();

			this.model.set('stopClick', true);

		}

	},
	upgradeTheEconomy: function() {

		if(!this.model.get('stopClick')) {

			var treasury = Math.round(App.Utilities.getTreasury() - this.model.get('diffToNext')),
				newSideLevelspend = App.Models.nationStats.get(App.Utilities.activeSide()).get('econLevelSpend');

			App.Utilities.upgradeTerrEconLevel();

			App.Utilities.flipEls(['.econMorale-bar', '.econMorale-bar', '.econLevel-bar', '.economicOutput-bar']);

			App.Models.nationStats.payForUpgrade(treasury);
			App.Models.nationStats.get(App.Utilities.activeSide()).set('econLevelSpend', (newSideLevelspend + this.model.get('diffToNext')));

			App.Views.battleMap.notify({
				icon: 'glyphicon glyphicon-education',
				titleTxt : "Tech Level Upgraded in&nbsp;" + App.Models.selectedTerrModel.get('name'),
				msgType:'success',
				delay: App.Constants.DELAY_SHORTEST,
			});

			this.model.set('stopClick', true);

		}

	},
	updateTheFortLevel: function() {

		if(!this.model.get('stopClick')) {

			var treasury = App.Utilities.getTreasury() - this.model.get('diffToNext'),
				newSideFortLevelspend = App.Models.nationStats.get(App.Utilities.activeSide()).get('fortLevelSpend');

			App.Utilities.upgradeTerrArmyFortLevel();
			App.Utilities.flipEls(['.econMorale-bar', '.econMorale-bar', '.fortStrength-main', '.economicOutput-bar']);
			App.Models.nationStats.payForUpgrade(treasury);
			App.Models.nationStats.get(App.Utilities.activeSide()).set('fortLevelSpend', (newSideFortLevelspend + this.model.get('diffToNext')));
			App.Utilities.displayInRange();

			App.Views.battleMap.notify({
				icon: 'glyphicon glyphicon-signal',
				titleTxt : "Fort Upgraded: Level&nbsp;" + App.Models.selectedTerrModel.get('fortLevel'),
				msgTxt : "Everyone feels safer in " + App.Models.selectedTerrModel.get('name') + " after installation of new $" + App.Utilities.addCommas(this.model.get('diffToNext')) + "&nbsp;defenses.",
				msgType:'success'
			});

			this.model.set('stopClick', true);

		}

	}

});