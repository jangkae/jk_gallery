$.fn.fe_slideGallery = function(options){
	var opts = $.extend({}, $.fn.fe_slideGallery.defaults, options);
	return $(this).each(function() {
		//object
		var $this = $(this);
		var $imgContainer = opts.imgContainer == 'this' ? $this : $this.find(opts.imgContainer);
		var $imgWrap = $imgContainer.find(opts.imgWrap);
		var $imgArr = $imgContainer.find(opts.img);
		var $nextBtn = $this.find(opts.nextBtn);
		var $prevBtn = $this.find(opts.prevBtn);
		var $indicator = $this.find(opts.indicator);
		//number
		var stepWidth, totalWidth, maxMove;
		var startX,startY,startLeft,startTime,isV,isH,activeNum=opts.activeNum||0;
		var bc = opts.btnDisabledClass, ic = opts.indicatorClass;
		if ( !$imgArr.length ) {
			$(this).hide();
			return;
		}
		if ( $imgArr.length == 1 ) {
			if ( !$nextBtn.hasClass(bc) ) {
				$nextBtn.add($prevBtn).each(function(){
					var $chkElem = opts.btnDisabledElem == 'parent' ? $(this).parent() : $(this);
					$chkElem.addClass(bc);
					$(this).bind('click',function(){return false});
				});
				$indicator.bind('click',function(){return false});
				$indicator.add($nextBtn).add($prevBtn).remove();
				imgHeightChk();
				$this.data('galleryObject', true);
			}
			return;
		}
		//public method
		$this[0].mouseEnable = bindMouseEvent;
		$this[0].touchEnable = bindTouchEvent;
		$this[0].resetElement = resetElement;
		$this[0].activeFn = activeFn;

		init();

		function init() {
			resetElement();
			bindBtnEvent();
			bindTouchEvent(true);
			bindMouseEvent(true);
			$(window).bind('resize.fe_slideGallery',resizeFn);
			activeFn(0);

			imgHeightChk();
			$this.data('galleryObject', true);
		}

		function imgHeightChk(){
			var imgCnt = 0;
			$imgArr.each(function(i,o){$(o).load(onComp).error(onComp);});
			function onComp(){
				$(this).data({'width':$(this).width(),'height':$(this).height()});
				if (++imgCnt==$imgArr.length) chkHeight();
			}
		}

		//view
		function resetElement(){
			$this.fe_tempVisible(true);
			stepWidth = $imgContainer.outerWidth();
			totalWidth = stepWidth * $imgArr.length;
			maxMove = totalWidth - stepWidth;
			$imgWrap.width(totalWidth);
			$imgArr.width(stepWidth).each(function(i,o){
				$(o).css('left', i*stepWidth);
			});
			$this.fe_tempVisible(false);
		}

		//event bind
		function bindTouchEvent(bln){
			if ( !('ontouchstart' in window) ) return;
			var method = bln ? 'addEventListener' : 'removeEventListener';
			$imgContainer[0][method]('touchstart',touchStart);
			$imgContainer[0][method]('touchmove',touchMove);
			$imgContainer[0][method]('touchend',touchEnd);
		}

		function bindMouseEvent(bln){
			var method = bln ? 'bind' : 'unbind';
			$imgContainer[method]('mousedown.fe_slideGallery',downFn);
		}

		function bindBtnEvent(){
			$($nextBtn).add($prevBtn).bind('click.fe_slideGallery',function(e){
				e.preventDefault();
				e.stopPropagation();
				var $chkElem = opts.btnDisabledElem == 'parent' ? $(this).parent() : $(this);
				if ( $chkElem.hasClass(opts.btnDisabledClass) ) return;
				chkActiveNum($(this).is(opts.nextBtn)?1:-1);
				activeFn();
				if ( typeof opts.onBtnClick == 'function' ) opts.onBtnClick(e);
			});

			$indicator.each(function(i,o){
				$(o).bind('click.fe_slideGallery',function(e){
					e.preventDefault();
					e.stopPropagation();
					if ( activeNum == i ) return;
					activeNum = i;
					activeFn();
					if ( typeof opts.onBtnClick == 'function' ) opts.onBtnClick(e);
				});
			});
		}

		//functions
		function touchStart(e){
			if ( chkSkipElem(e) ) return true;
			$imgWrap.stop(true);
			isV = isH = false;
			defineStart(e);
		}

		function touchMove(e){
			//console.log ( 'touchMove' );
			//if ( chkSkipElem(e) ) return true;
			if ( !startX ) defineStart(e);
			var to = e.type.substr(0,5) == 'touch' ? e.changedTouches[0] : e;
			var moveX = startX-to.pageX;
			var moveY = startY-to.pageY;

			if ( !isV && !isH ) {
				if ( Math.abs(moveX) == Math.abs(moveY) ) return;
				else if ( Math.abs(moveX) > Math.abs(moveY) ) isH = true, isV = false;
				else isH = false, isV = true;
			}

			if ( isV ) {
				touchEnd();
				upFn();
				return;
			}

			e.preventDefault();
			var targetLeft = startLeft - moveX;

			var frontOver = targetLeft > 0;
			var backOver = targetLeft < -maxMove;
			if ( frontOver || backOver ) {
				var gap = frontOver ? targetLeft : Math.sub(-maxMove, targetLeft);
				var movePos = (frontOver?1:-1)*gap*(0.3+(100-gap > 0? ((100-gap )*0.001):0));
				targetLeft = (frontOver?0:-maxMove)+movePos;
			}
			$imgWrap.find('a').addClass('disableState');
			$imgWrap.css('marginLeft', targetLeft);
		}

		function touchEnd(e){
			//if ( chkSkipElem(e) ) return true;
			//if ( e ) e.preventDefault();
			var currentLeft = parseInt($imgWrap.css('marginLeft'));
			var time = new Date().getTime() - startTime;
			var gap = Math.sub(startLeft,currentLeft);
			var isSwipe = time < 300 && gap/time > 0.3;
			var du;
			if ( isSwipe ) {
				chkActiveNum(currentLeft > startLeft ? -1 : 1);
				du = (stepWidth)-((gap/time)*100);
			} else {
				if ( currentLeft>0 ) activeNum = 0;
				else if(currentLeft < -maxMove ) activeNum = $imgArr.length - 1;
				else activeNum = Math.floor((Math.abs(currentLeft)+(stepWidth/2))/stepWidth);
			}
			activeFn(du);
			setTimeout(function(){$imgWrap.find('a').removeClass('disableState');},1);
		}

		function defineStart(e){
			var to = e.type.substr(0,5) == 'touch' ? e.changedTouches[0] : e;
			startX = to.pageX;
			startY = to.pageY;
			startLeft = (parseInt($imgWrap.css('marginLeft'))||0);
			startTime = new Date().getTime();
		}
		//touch end
		
		//mouse
		function downFn(e){
			if ( chkSkipElem(e) ) return true;
			e.preventDefault();
			$(document).bind('mousemove.fe_slideGallery',touchMove);
			$(document).bind('mouseleave.fe_slideGallery',upFn);
			$(document).bind('mouseup.fe_slideGallery',upFn);
			touchStart(e);
		}

		function upFn(e){
			if ( e ) e.preventDefault();
			$(document).unbind('mousemove.fe_slideGallery');
			$(document).unbind('mouseup.fe_slideGallery');
			touchEnd(e);
		}

		function chkActiveNum(n){
			activeNum += n;
			if ( activeNum < 0 ) activeNum = 0;
			else if ( activeNum > $imgArr.length - 1 ) activeNum = $imgArr.length - 1;
		}
		
		//control
		function btnCtrl() {
			var $n = opts.btnDisabledElem == 'parent' ? $nextBtn.parent() : $nextBtn;
			var $p = opts.btnDisabledElem == 'parent' ? $prevBtn.parent() : $prevBtn;
			if ( activeNum == 0 ) $n.removeClass(bc),$p.addClass(bc);
			else if ( activeNum == $imgArr.length-1) $n.addClass(bc),$p.removeClass(bc);
			else $n.removeClass(bc),$p.removeClass(bc);
			indicatorCtrl();
			chkHeight();
		}
		
		function indicatorCtrl() {
			$indicator.filter('.'+ic).removeClass(ic);
			$indicator.eq(activeNum).addClass(ic);
		}
		
		function chkHeight() {
			if ( !opts.checkHeight || !$this.data('galleryObject') ) return;
			var h = $imgArr.eq(activeNum).height();
			var oh = $imgArr.eq(activeNum).parent().outerHeight(true);
			if ( !h ) return;
			var arrowBtnTop = parseInt((h-$nextBtn.height())/2);
			if ( parseInt($nextBtn.parent().css('top')) != arrowBtnTop ) $nextBtn.parent().add($prevBtn.parent()).stop().animate({'top':arrowBtnTop},{easing:'easeOutCubic',duration:300});
			if ( $imgContainer.outerHeight() != oh ) $imgContainer.stop().animate({'height':oh},{easing:'easeOutCubic',duration:300});
		}

		function activeFn(du, n){
			if ( typeof n != 'undefined' ) activeNum = n;
			var targetLeft = -activeNum*stepWidth;
			if ( typeof du == 'undefined' ) du = 200 + (Math.sub(parseInt($imgWrap.css('marginLeft'))||0, targetLeft)*opts.autoDuration);
			if ( typeof opts.onStartSlide == 'function' ) opts.onStartSlide();
			if ( du ) {
				$imgWrap.stop().animate({marginLeft:targetLeft},{duration:du,easing:'easeOutCubic',complete:function(){
					if ( typeof opts.onCompleteSlide == 'function' ) opts.onCompleteSlide();
				}});
			} else $imgWrap.stop().css('marginLeft', targetLeft );
			startX = startLeft = startTime = null;
			btnCtrl();
			$this[0].activeNum = activeNum;
			$this.trigger('onActive');
		}
		
		//resize
		function resizeFn(e){
			if ( $imgContainer.is(':hidden') ) return;
			//console.log ( $imgContainer.outerWidth() != stepWidth );
			if ( $imgContainer.outerWidth() != stepWidth ) {
				resetElement();
				//console.log ( $imgContainer.outerWidth() , 
				activeFn(0);
			}
		}
	});

	//utils
	function chkSkipElem(elem){
		if ( !opts.skipElem || !elem ) return false;
		var arr = opts.skipElem.split('|'), bln;
		for ( var i = 0 ; i < arr.length ; i++ ) {
			if ( $(elem.target).is(arr[i]) || $(elem.target).parents(arr[i]).length ) {
				bln = true;
				break;
			}
		}
		return bln;
	}
}

$.fn.fe_slideGallery.defaults = {
	imgContainer:'.figure.visual',
	imgWrap:'.imgList',
	img:'.imgList li img',
	nextBtn:'.next a',
	prevBtn:'.prev a',
	btnDisabledClass:'disabled',
	btnDisabledElem:null,
	indicator:'.navi a',
	indicatorClass:'atv',
	checkHeight:true,
	autoDuration:0.5,
	skipElem:null,					//ex- 'p|span|.aaa'
	onStartSlide:null,
	onCompleteSlide:null,
	onBtnClick:null,
	activeNum:0,
	
}