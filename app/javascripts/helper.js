window.helper = function() {
	whichAnimationEvent = function (){
	    var t;
	    var el = document.createElement('fakeelement');
	    var transitions = {
	      'animation':'animationend',
	      'OAnimation':'oAnimationEnd',
	      'MozAnimation':'animationend',
	      'WebkitAnimation':'webkitAnimationEnd'
	    }

	    for(t in transitions){
	        if( el.style[t] !== undefined ){
	            return transitions[t];
	        }
	    }
	};

	whichTransitionEvent = function(){
	    var t;
	    var el = document.createElement('fakeelement');
	    var transitions = {
	      'transition':'transitionend',
	      'OTransition':'oTransitionEnd',
	      'MozTransition':'transitionend',
	      'WebkitTransition':'webkitTransitionEnd'
	    }

	    for(t in transitions){
	        if( el.style[t] !== undefined ){
	            return transitions[t];
	        }
	    }
	};

	stripUnits = function(value) {
		return parseInt(value.replace(/[^-\d\.]/g, ''));
	};

	/**
	 * Return the raw item name
	 * (basically without '#', '.' or '[]')
	 *
	 * @param  {String} _string Item name / Data attribute including '#', '.' or '[]'
	 * @return {String}         Raw item name
	 */
	getRawName = function(_string) {
	    return _string.replace(/[.#\[\]]/g, '');
	};

	return {
		transitionEnd: whichTransitionEvent(),
		animationEnd: whichAnimationEvent(),
		stripUnits: stripUnits,
		getRawName: getRawName
	}
}();