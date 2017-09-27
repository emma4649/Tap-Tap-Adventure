var cls = require('../../../../lib/class');

/**
 * Author: Tachyon
 * Company: uDeva 2017
 */

module.exports = Hit = cls.Class.extend({

    init: function(type, damage) {
        var self = this;

        self.type = type;
        self.damage = damage;
    },

    isRanged: function() {
        return this.ranged;
    },

    getDamage: function() {
        return this.damage;
    },

    getData: function() {
        return {
            type: this.type,
            damage: this.damage,
            isRanged: this.isRanged()
        }
    }

});