/**
 * Created by flavius on 2017-01-07.
 */
var Quest = require('./quest'),
    Messages = require('../network/packets/message'),
    Types = require('../../../../shared/js/gametypes'),
    Utils = require('../utils/utils');

/**
 * Quest stages:
 * {
 *  1: Player first logs in, instructions regarding movement appear. Player exits those and
 *     an NPC starts talking, asking the player to come to him. This NPC explains the nature of
 *     the universe the player is in. He constantly refers to him as an adventurer, and his task
 *     is to slay the great Gragon. The player exits this cave, having maxed out gear, must battle
 *     Gragon. However, he is doomed to fail, as Gragon deals far too much damage, and is impossible
 *     to beat in this instance (set Gragon's life to never reach 0 or simply heal too fast)
 *
 *  Allow player to speak after this.
 *
 *  2: The player wakes up in a hospital-like environment, he is confused, his gear is lost, a NPC
 *     explains he was not able to defeat the great Gragon, and that he is lucky to have survived.
 *
 *  3: Upon exiting the hospital, the player is taken through a tour of the skills throughout TTA,
 *     explaining how archery, melee and magic works. How crafting, auctions, shops, banks, trading works.
 *
 *  From here, we just keep adding steps, the first two will be one of the most complex.
 *
 *  this.stage setup -> 0-10 for the 1st stage above
 *                   -> 11-20 for 2nd stage, etc.
 * }
 */

module.exports = Introduction = Quest.extend({
    init: function(jsonData, player) {
        var self = this;

        self._super(jsonData.id, jsonData.name, jsonData.name);
        
        self.jsonData = jsonData;
        self.player = player;
        self.server = self.player.server;
        
        self.load();

        self.onFinishedLoading(function() {
            if (self.stage == 9999)
                return;

            if (self.stage <= 10)
                self.toggleTalking();

            setTimeout(function() {
                self.setPointer();
            }, 100);


            self.player.packetHandler.onTalkToNPC(function(npcKind, npcId, talkIndex) {
                var conversation = self.getConversation(npcKind);

                self.server.pushToPlayer(self.player, new Messages.TalkToNPC(npcId, conversation));

                if (talkIndex >= conversation.length)
                    self.checkProgress();
            });

            self.player.packetHandler.onButtonClick(function(buttonId, state) {
                log.info('Clicked button: ' + buttonId + ' state: ' + state);
                
                if (self.stage == 1) {
                    if (buttonId == 'inventoryButton' && state) {
                        log.info('Player clicked the inventory button appropriately.');
                    }
                }
            });
        });
    },

    load: function() {
        var self = this;


        self.player.redisPool.getQuestStage(self.player.name, self.getId(), function(stage) {

            if (!stage)
                self.update();
            else
                self.stage = stage;

            if (self.finished_callback)
                self.finished_callback();
        });
    },

    checkProgress: function() {
        var self = this;

        self.nextStage();

    },

    toggleTalking: function() {
        var self = this;

        /**
         * We do not want players to talk when they first log in,
         * this is to prevent bots advertising and whatnot.
         */

        self.player.talkingAllowed = !self.player.talkingAllowed;
    },
    
    update: function() {
        var self = this;

        self.player.redisPool.setQuestStage(self.player.name, self.getId(), self.stage);
    },

    clearPointers: function() {
        var self = this;

        self.server.pushToPlayer(self.player, new Messages.Pointer(Types.Pointers.Clear, null));
    },

    setPointer: function() {
        var self = this,
            pointerData = self.jsonData.pointers[self.stage],
            id = self.player.id + '' + Utils.random(0, 500),
            data = [],
            pointerType = pointerData.shift();

        data.push(id);

        for (var i = 0; i < pointerData.length; i++)
            data.push(pointerData[i]);

        self.server.pushToPlayer(self.player, new Messages.Pointer(pointerType, data));
    },

    getConversation: function(npcKind) {
        var self = this,
            conversationArray = self.jsonData.conversations[npcKind][self.stage];

        return conversationArray;
    },

    nextStage: function() {
        var self = this;

        self.clearPointers();

        self.stage++;
        self.update();

        self.setPointer();
    },

    onFinishedLoading: function(callback) {
        this.finished_callback = callback;
    }
});