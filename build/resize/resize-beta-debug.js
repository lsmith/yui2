/**
 * @description <p>Makes an element resizable</p>
 * @class Resize
 * @namespace YAHOO.util
 * @requires yahoo, dom, dragdrop, element, event
 * @optional animation
 * @extends Element
 * @beta
 */
(function() {
var Dom = YAHOO.util.Dom,
    Event = YAHOO.util.Event,
    Lang = YAHOO.lang;

    /**
     * @constructor
     * @param {String/HTMLElement} el The element to make resizable.
     * @param {Object} attrs Object liternal containing configuration parameters.
    */

    var Resize = function(el, config) {
        YAHOO.log('Creating Resize Object', 'info', 'Resize');
        var oConfig = {
            element: el,
            attributes: config || {}
        };

        Resize.superclass.constructor.call(this, oConfig.element, oConfig.attributes);    
    };

    /**
    * @private
    * @static
    * @property _instances
    * @description Internal has table for all resize instances
    * @type Object
    */ 
    Resize._instances = {};
    /**
    * @static
    * @method getResizeById 
    * @description Get's a resize object by the HTML id of the element associated with the Resize object.
    * @return Object The Resize Object
    */ 
    Resize.getResizeById = function(id) {
        if (Resize._instances[id]) {
            return Resize._instances[id];
        }
        YAHOO.log('No Instance Found', 'error', 'Resize');
        return false;
    };

    YAHOO.extend(Resize, YAHOO.util.Element, {
        /**
        * @private
        * @property CSS_RESIZE
        * @description Base CSS class name
        * @type String
        */ 
        CSS_RESIZE: 'yui-resize',
        /**
        * @private
        * @property CSS_DRAG
        * @description Class name added when dragging is enabled
        * @type String
        */ 
        CSS_DRAG: 'yui-draggable',
        /**
        * @private
        * @property CSS_HOVER
        * @description Class name used for hover only handles
        * @type String
        */ 
        CSS_HOVER: 'yui-resize-hover',
        /**
        * @private
        * @property CSS_PROXY
        * @description Class name given to the proxy element
        * @type String
        */ 
        CSS_PROXY: 'yui-resize-proxy',
        /**
        * @private
        * @property CSS_WRAP
        * @description Class name given to the wrap element
        * @type String
        */ 
        CSS_WRAP: 'yui-resize-wrap',
        /**
        * @private
        * @property CSS_KNOB
        * @description Class name used to make the knob style handles
        * @type String
        */ 
        CSS_KNOB: 'yui-resize-knob',
        /**
        * @private
        * @property CSS_HIDDEN
        * @description Class name given to the wrap element to make all handles hidden
        * @type String
        */ 
        CSS_HIDDEN: 'yui-resize-hidden',
        /**
        * @private
        * @property CSS_HANDLE
        * @description Class name given to all handles, used as a base for single handle names as well.. Handle "t" will get this.CSS_HANDLE + '-t' as well as this.CSS_HANDLE
        * @type String
        */ 
        CSS_HANDLE: 'yui-resize-handle',
        /**
        * @private
        * @property CSS_STATUS
        * @description Class name given to the status element
        * @type String
        */ 
        CSS_STATUS: 'yui-resize-status',
        /**
        * @private
        * @property CSS_GHOST
        * @description Class name given to the wrap element when the ghost property is active
        * @type String
        */ 
        CSS_GHOST: 'yui-resize-ghost',
        /**
        * @private
        * @property CSS_RESIZING
        * @description Class name given to the wrap element when a resize action is taking place.
        * @type String
        */ 
        CSS_RESIZING: 'yui-resize-resizing',
        /**
        * @private
        * @property _resizeEvent
        * @description The mouse event used to resize with
        * @type Event
        */ 
        _resizeEvent: null,
        /**
        * @private
        * @property dd
        * @description The DragDrop instance used if draggable is true
        * @type Object
        */ 
        dd: null,
        /** 
        * @private
        * @property browser
        * @description A copy of the YAHOO.env.ua property
        * @type Object
        */
        browser: YAHOO.env.ua,
        /** 
        * @private
        * @property _positioned
        * @description A flag to show if the element is absolutely positioned
        * @type Boolean
        */
        _positioned: null,
        /** 
        * @private
        * @property _dds
        * @description An Object containing references to all of the DragDrop instances used for the resize handles
        * @type Object
        */
        _dds: null,
        /** 
        * @private
        * @property _wrap
        * @description The HTML reference of the element wrapper
        * @type HTMLElement
        */
        _wrap: null,
        /** 
        * @private
        * @property _proxy
        * @description The HTML reference of the element proxy
        * @type HTMLElement
        */
        _proxy: null,
        /** 
        * @private
        * @property _handles
        * @description An object containing references to all of the resize handles.
        * @type Object
        */
        _handles: null,
        /** 
        * @private
        * @property _currentHandle
        * @description The string identifier of the currently active handle. e.g. 'r', 'br', 'tl'
        * @type String
        */
        _currentHandle: null,
        /** 
        * @private
        * @property _currentDD
        * @description A link to the currently active DD object
        * @type Object
        */
        _currentDD: null,
        /** 
        * @private
        * @property _cache
        * @description An lookup table containing key information for the element being resized. e.g. height, width, x position, y position, etc..
        * @type Object
        */
        _cache: null,
        /** 
        * @private
        * @property _active
        * @description Flag to show if the resize is active. Used for events.
        * @type Boolean
        */
        _active: null,
        /** 
        * @private
        * @method _createProxy
        * @description Creates the proxy element if the proxy config is true
        */
        _createProxy: function() {
            if (this.get('proxy')) {
                YAHOO.log('Creating the Proxy Element', 'info', 'Resize');
                this._proxy = document.createElement('div');
                this._proxy.className = this.CSS_PROXY;
                this._proxy.style.height = this.get('element').clientHeight + 'px';
                this._proxy.style.width = this.get('element').clientWidth + 'px';
                document.body.appendChild(this._proxy);
            } else {
                YAHOO.log('No proxy element, turn off animate config option', 'info', 'Resize');
                this.set('animate', false);
            }
        },
        /** 
        * @private
        * @method _createWrap
        * @description Creates the wrap element if the wrap config is true. It will auto wrap the following element types: img, textarea, input, iframe, select
        */
        _createWrap: function() {
            YAHOO.log('Create the wrap element', 'info', 'Resize');
            this._positioned = false;
            //Force wrap for elements that can't have children 
            switch (this.get('element').tagName.toLowerCase()) {
                case 'img':
                case 'textarea':
                case 'input':
                case 'iframe':
                case 'select':
                    this.set('wrap', true);
                    YAHOO.log('Auto-wrapping the element (' + this.get('element').tagName.toLowerCase() + ')', 'warn', 'Resize');
                    break;
            }
            if (this.get('wrap')) {
                YAHOO.log('Creating the wrap element', 'info', 'Resize');
                this._wrap = document.createElement('div');
                this._wrap.id = this.get('element').id + '_wrap';
                this._wrap.className = this.CSS_WRAP;
                Dom.setStyle(this._wrap, 'width', this.get('width'));
                Dom.setStyle(this._wrap, 'height', this.get('height'));
                var pos = Dom.getStyle(this.get('element'), 'position');
                Dom.setStyle(this._wrap, 'position', ((pos == 'static') ? 'relative' : pos));
                Dom.setStyle(this._wrap, 'top', Dom.getStyle(this.get('element'), 'top'));
                Dom.setStyle(this._wrap, 'left', Dom.getStyle(this.get('element'), 'left'));
                if (Dom.getStyle(this.get('element'), 'position') == 'absolute') {
                    this._positioned = true;
                    YAHOO.log('The element is positioned absolute', 'info', 'Resize');
                    Dom.setStyle(this.get('element'), 'position', 'relative');
                    Dom.setStyle(this.get('element'), 'top', '0');
                    Dom.setStyle(this.get('element'), 'left', '0');
                }
                var par = this.get('element').parentNode;
                par.replaceChild(this._wrap, this.get('element'));
                this._wrap.appendChild(this.get('element'));
            } else {
                this._wrap = this.get('element');
                if (Dom.getStyle(this._wrap, 'position') == 'absolute') {
                    this._positioned = true;
                }
            }
            if (this.get('draggable')) {
                this._setupDragDrop();
            }
            if (this.get('hover')) {
                Dom.addClass(this._wrap, this.CSS_HOVER);
            }
            if (this.get('knobHandles')) {
                Dom.addClass(this._wrap, this.CSS_KNOB);
            }
            if (this.get('hiddenHandles')) {
                Dom.addClass(this._wrap, this.CSS_HIDDEN);
            }
            Dom.addClass(this._wrap, this.CSS_RESIZE);
        },
        /** 
        * @private
        * @method _setupDragDrop
        * @description Setup the DragDrop instance on the element
        */
        _setupDragDrop: function() {
            YAHOO.log('Setting up the dragdrop instance on the element', 'info', 'Resize');
            Dom.addClass(this._wrap, this.CSS_DRAG);
            this.dd = new YAHOO.util.DD(this._wrap, this.get('id') + '-resize', { dragOnly: true });
            this.dd.on('dragEvent', function() {
                this.fireEvent('dragEvent', arguments);
            }, this, true);
        },
        /** 
        * @private
        * @method _createHandles
        * @description Creates the handles as specified in the config
        */
        _createHandles: function() {
            YAHOO.log('Creating the handles', 'info', 'Resize');
            this._handles = {};
            this._dds = {};
            var h = this.get('handles');
            for (var i = 0; i < h.length; i++) {
                YAHOO.log('Creating handle position: ' + h[i], 'info', 'Resize');
                this._handles[h[i]] = document.createElement('div');
                this._handles[h[i]].id = Dom.generateId(this._handles[h[i]]);
                this._handles[h[i]].className = this.CSS_HANDLE + ' ' + this.CSS_HANDLE + '-' + h[i];
                this._wrap.appendChild(this._handles[h[i]]);
                Event.on(this._handles[h[i]], 'mouseover', this._handleMouseOver, this, true);
                Event.on(this._handles[h[i]], 'mouseout', this._handleMouseOut, this, true);
                this._dds[h[i]] = new YAHOO.util.DragDrop(this._handles[h[i]], this.get('id') + '-handle-' + h);
                this._dds[h[i]].on('startDragEvent', this._handleStartDrag, this._dds[h[i]], this);
                this._dds[h[i]].on('mouseDownEvent', this._handleMouseDown, this._dds[h[i]], this);
            }
            YAHOO.log('Creating the Status box', 'info', 'Resize');
            this._status = document.createElement('span');
            this._status.className = this.CSS_STATUS;
            document.body.insertBefore(this._status, document.body.firstChild);
        },
        /** 
        * @private
        * @method _ieSelectFix
        * @description The function we use as the onselectstart handler when we start a drag in Internet Explorer
        */
        _ieSelectFix: function() {
            return false;
        },
        /** 
        * @private
        * @property _ieSelectBack
        * @description We will hold a copy of the current "onselectstart" method on this property, and reset it after we are done using it.
        */
        _ieSelectBack: null,
        /** 
        * @private
        * @method _setAutoRatio
        * @param {Event} ev A mouse event.
        * @description This method checks to see if the "autoRatio" config is set. If it is, we will check to see if the "Shift Key" is pressed. If so, we will set the config ratio to true.
        */
        _setAutoRatio: function(ev) {
            if (this.get('autoRatio')) {
                YAHOO.log('Setting up AutoRatio', 'info', 'Resize');
                if (ev && ev.shiftKey) {
                    //Shift Pressed
                    YAHOO.log('Shift key presses, turning on ratio', 'info', 'Resize');
                    this.set('ratio', true);
                    if (this.browser.ie) {
                        this._ieSelectBack = document.body.onselectstart;
                        document.body.onselectstart = this._ieSelectFix;
                    }
                } else {
                    YAHOO.log('Resetting ratio back to default', 'info', 'Resize');
                    this.set('ratio', this._configs.ratio._initialConfig.value);
                }
            }
        },
        /** 
        * @private
        * @method _handleMouseDown
        * @param {Event} cev The CustomEvent.
        * @param {Event} ev A mouse event.
        * @description This method preps the autoRatio on MouseDown.
        */
        _handleMouseDown: function(cev, ev) {
            if (Dom.getStyle(this._wrap, 'position') == 'absolute') {
                this._positioned = true;
            }
            if (ev && ev[0]) {
                this._setAutoRatio(ev[0]);
            }
        },
        /** 
        * @private
        * @method _handleMouseOver
        * @param {Event} ev A mouse event.
        * @description Adds CSS class names to the handles
        */
        _handleMouseOver: function(ev) {
            //Internet Explorer needs this
            Dom.removeClass(this._wrap, this.CSS_RESIZE);
            if (this.get('hover')) {
                Dom.removeClass(this._wrap, this.CSS_HOVER);
            }
            var tar = Event.getTarget(ev);
            if (Dom.hasClass(tar, this.CSS_HANDLE) && !this._active) {
                Dom.addClass(tar, this.CSS_HANDLE + '-active');
                for (var i in this._handles) {
                    if (Lang.hasOwnProperty(this._handles, i)) {
                        if (this._handles[i] == tar) {
                            YAHOO.log('Handle active: ' + i, 'info', 'Resize');
                            Dom.addClass(tar, this.CSS_HANDLE + '-' + i + '-active');
                            break;
                        }
                    }
                }
            }

            //Internet Explorer needs this
            Dom.addClass(this._wrap, this.CSS_RESIZE);
        },
        /** 
        * @private
        * @method _handleMouseOut
        * @param {Event} ev A mouse event.
        * @description Removes CSS class names to the handles
        */
        _handleMouseOut: function(ev) {
            //Internet Explorer needs this
            Dom.removeClass(this._wrap, this.CSS_RESIZE);
            if (this.get('hover') && !this._active) {
                Dom.addClass(this._wrap, this.CSS_HOVER);
            }
            var tar = Event.getTarget(ev);
            if (Dom.hasClass(tar, this.CSS_HANDLE) && !this._active) {
                Dom.removeClass(tar, this.CSS_HANDLE + '-active');
                for (var i in this._handles) {
                    if (Lang.hasOwnProperty(this._handles, i)) {
                        if (this._handles[i] == tar) {
                            YAHOO.log('Handle Inactive: ' + i, 'info', 'Resize');
                            Dom.removeClass(tar, this.CSS_HANDLE + '-' + i + '-active');
                            break;
                        }
                    }
                }
            }
            //Internet Explorer needs this
            Dom.addClass(this._wrap, this.CSS_RESIZE);
        },
        /** 
        * @private
        * @method _handleStartDrag
        * @param {Event} ev A mouse event.
        * @param {Object} args The args passed from the CustomEvent.
        * @param {Object} dd The DragDrop object we are working with.
        * @description Resizes the proxy, sets up the DragDrop handlers, updates the status div and preps the cache
        */
        _handleStartDrag: function(ev, args, dd) {
            YAHOO.log('startDrag', 'info', 'Resize');
            var tar = dd.getDragEl();
            if (Dom.hasClass(tar, this.CSS_HANDLE)) {
                if (Dom.getStyle(this._wrap, 'position') == 'absolute') {
                    this._positioned = true;
                }
                this._active = true;
                this._currentDD = dd;
                if (this._proxy) {
                    YAHOO.log('Activate proxy element', 'info', 'Resize');
                    this._proxy.style.visibility = 'visible';
                    this._proxy.style.zIndex = '1000';
                    this._proxy.style.height = this.get('element').clientHeight + 'px';
                    this._proxy.style.width = this.get('element').clientWidth + 'px';
                }

                for (var i in this._handles) {
                    if (Lang.hasOwnProperty(this._handles, i)) {
                        if (this._handles[i] == tar) {
                            this._currentHandle = i;
                            var handle = '_handle_for_' + i;
                            Dom.addClass(tar, this.CSS_HANDLE + '-' + i + '-active');
                            dd.on('dragEvent', this[handle], this, true);
                            dd.on('mouseUpEvent', this._handleMouseUp, this, true);
                            YAHOO.log('Adding DragEvents to: ' + i, 'info', 'Resize');
                            break;
                        }
                    }
                }


                Dom.addClass(tar, this.CSS_HANDLE + '-active');

                if (this.get('proxy')) {
                    YAHOO.log('Posiiton Proxy Element', 'info', 'Resize');
                    var xy = Dom.getXY(this.get('element'));
                    Dom.setXY(this._proxy, xy);
                    if (this.get('ghost')) {
                        YAHOO.log('Add Ghost Class', 'info', 'Resize');
                        this.addClass(this.CSS_GHOST);
                    }
                }
                Dom.addClass(this._wrap, this.CSS_RESIZING);
                this._setCache();
                this._updateStatus(this._cache.height, this._cache.width, this._cache.top, this._cache.left);
                YAHOO.log('Firing startResize Event', 'info', 'Resize');
                this.fireEvent('startResize', { type: 'startresize', target: this});
            }
        },
        /** 
        * @private
        * @method _setCache
        * @description Sets up the this._cache hash table.
        */
        _setCache: function() {
            YAHOO.log('Setting up property cache', 'info', 'Resize');
            this._cache.xy = Dom.getXY(this._wrap);
            Dom.setXY(this._wrap, this._cache.xy);
            this._cache.height = this.get('clientHeight');
            this._cache.width = this.get('clientWidth');
            this._cache.start.height = this._cache.height;
            this._cache.start.width = this._cache.width;
            this._cache.start.top = this._cache.xy[1];
            this._cache.start.left = this._cache.xy[0];
            this._cache.top = this._cache.xy[1];
            this._cache.left = this._cache.xy[0];
        },
        /** 
        * @private
        * @method _handleMouseUp
        * @param {Event} ev A mouse event.
        * @description Cleans up listeners, hides proxy element and removes class names.
        */
        _handleMouseUp: function(ev) {
            this._active = false;

            var handle = '_handle_for_' + this._currentHandle;
            this._currentDD.unsubscribe('dragEvent', this[handle], this, true);
            this._currentDD.unsubscribe('mouseUpEvent', this._handleMouseUp, this, true);

            Dom.removeClass(this._handles[this._currentHandle], this.CSS_HANDLE + '-' + this._currentHandle + '-active');
            Dom.removeClass(this._handles[this._currentHandle], this.CSS_HANDLE + '-active');

            this._currentHandle = null;
            if (!this.get('animate')) {
                if (this.get('setSize')) {
                    YAHOO.log('Setting Height and Width', 'info', 'Resize');
                    this.set('height', this._cache.height);
                    this.set('width', this._cache.width);
                } else {
                    YAHOO.log('Setting Height and Width silently', 'info', 'Resize');
                    this.set('height', this._cache.height, true);
                    this.set('width', this._cache.width, true);
                }
            }

            if (this._proxy) {
                YAHOO.log('Hide Proxy Element', 'info', 'Resize');
                this._proxy.style.visibility = 'hidden';
                this._proxy.style.zIndex = '-1';
                if (this.get('setSize')) {
                    YAHOO.log('Setting Size', 'info', 'Resize');
                    this.resize(ev, this._cache.height, this._cache.width, this._cache.top, this._cache.left, true);
                } else {
                    YAHOO.log('Firing Resize Event', 'info', 'Resize');
                    this.fireEvent('resize', { ev: 'resize', target: this, height: this._cache.height, width: this._cache.width, top: this._cache.top, left: this._cache.left });
                }

                if (this.get('ghost')) {
                    YAHOO.log('Removing Ghost Class', 'info', 'Resize');
                    this.removeClass(this.CSS_GHOST);
                }
            }

            Dom.removeClass(this._wrap, this.CSS_RESIZING);
            if (this.get('hover')) {
                YAHOO.log('Adding hover class', 'info', 'Resize');
                Dom.addClass(this._wrap, this.CSS_HOVER);
            }
            if (this._status) {
                YAHOO.log('Hiding Status Box', 'info', 'Resize');
                Dom.setStyle(this._status, 'display', 'none');
            }
            if (this.browser.ie) {
                YAHOO.log('Resetting IE onselectstart function', 'info', 'Resize');
                document.body.onselectstart = this._ieSelectBack;
            }
            for (var i in this._handles) {
                if (Lang.hasOwnProperty(this._handles, i)) {
                    YAHOO.log('Removing active class', 'info', 'Resize');
                    Dom.removeClass(this._handles[i], this.CSS_HANDLE + '-active');
                }
            }
            if (this.get('hover') && !this._active) {
                YAHOO.log('Adding Hover Class', 'info', 'Resize');
                Dom.addClass(this._wrap, this.CSS_HOVER);
            }
            this._resizeEvent = null;
        },
        /** 
        * @private
        * @method _setRatio
        * @param {Number} h The height offset.
        * @param {Number} w The with offset.
        * @param {Number} t The top offset.
        * @param {Number} l The left offset.
        * @description Using the Height, Width, Top & Left, it recalcuates them based on the original element size.
        * @return Array The new Height, Width, Top & Left settings
        */
        _setRatio: function(h, w, t, l) {
            YAHOO.log('Setting Ratio', 'info', 'Resize');
            var oh = h, ow = w;
            if (this.get('ratio')) {
                var orgH = this._cache.height,
                    orgW = this._cache.width,
                    nh = parseInt(this.get('height'), 10),
                    nw = parseInt(this.get('width'), 10),
                    maxH = this.get('maxHeight'),
                    minH = this.get('minHeight'),
                    maxW = this.get('maxWidth'),
                    minW = this.get('minWidth');

                switch (this._currentHandle) {
                    case 'l':
                        h = nh * (w / nw);
                        h = Math.min(Math.max(minH, h), maxH);                        
                        w = nw * (h / nh);
                        t = (this._cache.start.top - (-((nh - h) / 2)));
                        l = (this._cache.start.left - (-((nw - w))));
                        break;
                    case 'r':
                        h = nh * (w / nw);
                        h = Math.min(Math.max(minH, h), maxH);                        
                        w = nw * (h / nh);
                        t = (this._cache.start.top - (-((nh - h) / 2)));
                        break;
                    case 't':
                        w = nw * (h / nh);
                        h = nh * (w / nw);
                        l = (this._cache.start.left - (-((nw - w) / 2)));
                        t = (this._cache.start.top - (-((nh - h))));
                        break;
                    case 'b':
                        w = nw * (h / nh);
                        h = nh * (w / nw);
                        l = (this._cache.start.left - (-((nw - w) / 2)));
                        break;
                    case 'bl':
                        h = nh * (w / nw);
                        w = nw * (h / nh);
                        l = (this._cache.start.left - (-((nw - w))));
                        break;
                    case 'br':
                        h = nh * (w / nw);
                        w = nw * (h / nh);
                        break;
                    case 'tl':
                        h = nh * (w / nw);
                        w = nw * (h / nh);
                        l = (this._cache.start.left - (-((nw - w))));
                        t = (this._cache.start.top - (-((nh - h))));
                        break;
                    case 'tr':
                        h = nh * (w / nw);
                        w = nw * (h / nh);
                        l = (this._cache.start.left);
                        t = (this._cache.start.top - (-((nh - h))));
                        break;
                }
                oh = this._checkHeight(h);
                ow = this._checkWidth(w);
                if ((oh != h) || (ow != w)) {
                    t = 0;
                    l = 0;
                }
            }
            return [oh, ow, t, l];
        },
        /** 
        * @private
        * @method _updateStatus
        * @param {Number} h The new height setting.
        * @param {Number} w The new width setting.
        * @param {Number} t The new top setting.
        * @param {Number} l The new left setting.
        * @description Using the Height, Width, Top & Left, it updates the status element with the elements sizes.
        */
        _updateStatus: function(h, w, t, l) {
            if (this._resizeEvent && (!Lang.isString(this._resizeEvent))) {
                YAHOO.log('Updating Status Box', 'info', 'Resize');
                if (this.get('status')) {
                    YAHOO.log('Showing Status Box', 'info', 'Resize');
                    Dom.setStyle(this._status, 'display', 'inline');
                }
                h = ((h === 0) ? this._cache.start.height : h);
                w = ((w === 0) ? this._cache.start.width : w);
                var h1 = parseInt(this.get('height'), 10),
                    w1 = parseInt(this.get('width'), 10);
                
                if (isNaN(h1)) {
                    h1 = parseInt(h, 10);
                }
                if (isNaN(w1)) {
                    w1 = parseInt(w, 10);
                }
                var diffH = (parseInt(h, 10) - h1);
                var diffW = (parseInt(w, 10) - w1);
                this._cache.offsetHeight = diffH;
                this._cache.offsetWidth = diffW;
                this._status.innerHTML = '<strong>' + parseInt(h, 10) + ' x ' + parseInt(w, 10) + '</strong><em>' + ((diffH > 0) ? '+' : '') + diffH + ' x ' + ((diffW > 0) ? '+' : '') + diffW + '</em>';
                Dom.setXY(this._status, [Event.getPageX(this._resizeEvent) + 12, Event.getPageY(this._resizeEvent) + 12]);
            }
        },
        /** 
        * @method reset
        * @description Resets the element to is start state.
        */
        reset: function() {
            YAHOO.log('Resetting to cached sizes and position', 'info', 'Resize');
            this.resize(null, this._cache.start.height, this._cache.start.width, this._cache.start.top, this._cache.start.left, true);
            return this;
        },
        /** 
        * @method resize
        * @param {Event} ev The mouse event.
        * @param {Number} h The new height setting.
        * @param {Number} w The new width setting.
        * @param {Number} t The new top setting.
        * @param {Number} l The new left setting.
        * @param {Boolean} force Resize the element (used for proxy resize).
        * @description Resizes the element, wrapper or proxy based on the data from the handlers.
        */
        resize: function(ev, h, w, t, l, force) {
            YAHOO.log('Resize', 'info', 'Resize');
            this._resizeEvent = ev;
            var el = this._wrap, anim = this.get('animate'), set = true;
            if (this._proxy && !force) {
                el = this._proxy;
                anim = false;
            }
            if (this.get('autoRatio')) {
                this._setAutoRatio(ev);
            }
            if (this._positioned) {
                if (this._proxy) {
                    t = this._cache.top - t;
                    l = this._cache.left - l;
                }
            }

            var ratio = this._setRatio(h, w, t, l);
            h = parseInt(ratio[0], 10);
            w = parseInt(ratio[1], 10);
            t = parseInt(ratio[2], 10);
            l = parseInt(ratio[3], 10);

            if (t == 0) {
                //No Offset, get from cache
                t = Dom.getY(el);
            }
            if (l == 0) {
                //No Offset, get from cache
                l = Dom.getX(el);
            }

            this._updateStatus(h, w, t, l);
            

            if (this._positioned) {
                if (this._proxy && force) {
                    if (!anim) {
                        el.style.top = this._proxy.style.top;
                        el.style.left = this._proxy.style.left;
                    } else {
                        t = this._proxy.style.top;
                        l = this._proxy.style.left;
                    }
                } else {
                    if (!this.get('ratio') && !this._proxy) {
                        t = this._cache.top + -(t);
                        l = this._cache.left + -(l);
                    }
                    if (t) {
                        if (this.get('minY')) {
                            if (t < this.get('minY')) {
                                t = this.get('minY');
                            }
                        }
                        if (this.get('maxY')) {
                            if ((t + h) > this.get('maxY')) {
                                t = (this.get('maxY') - h);
                            }
                        }
                    }
                    if (l) {
                        if (this.get('minX')) {
                            if (l < this.get('minX')) {
                                l = this.get('minX');
                            }
                        }
                        if (this.get('maxX')) {
                            if ((l + w) > this.get('maxX')) {
                                l = (this.get('maxX') - w);
                            }
                        }
                    }
                }
            }
            YAHOO.log('beforeResize', 'info', 'Resize');
            var beforeReturn = this.fireEvent('beforeResize', { ev: 'beforeResize', target: this, height: h, width: w, top: t, left: l });
            if (beforeReturn === false) {
                YAHOO.log('Resized cancelled because befireResize returned false', 'info', 'Resize');
                return false;
            }
            if (this._positioned) {
                if (this._proxy && force) {
                    //Do nothing
                } else {
                    if (t) {
                        Dom.setY(el, t);
                        this._cache.top = t;
                    }
                    if (l) {
                        Dom.setX(el, l);
                        this._cache.left = l;
                    }
                }
            }
            if (h) {
                this._cache.height = h;
                if (!anim) {
                    set = true;
                    if (this._proxy && force) {
                        if (!this.get('setSize')) {
                            set = false;
                        }
                    }
                    if (set) {
                        el.style.height = h + 'px';
                    }
                    if ((this._proxy && force) || !this._proxy) {
                        if (this._wrap != this.get('element')) {
                            this.get('element').style.height = h + 'px';
                        }
                    }
                }
            }
            if (w) {
                this._cache.width = w;
                if (!anim) {
                    set = true;
                    if (this._proxy && force) {
                        if (!this.get('setSize')) {
                            set = false;
                        }
                    }
                    if (set) {
                        el.style.width = w + 'px';
                    }
                    if ((this._proxy && force) || !this._proxy) {
                        if (this._wrap != this.get('element')) {
                            this.get('element').style.width = w + 'px';
                        }
                    }
                }
            }
            if (anim) {
                if (YAHOO.util.Anim) {
                    var _anim = new YAHOO.util.Anim(el, {
                        height: {
                            to: this._cache.height
                        },
                        width: {
                            to: this._cache.width
                        }
                    }, this.get('animateDuration'), this.get('animateEasing'));
                    if (this._positioned) {
                        if (t) {
                            _anim.attributes.top = {
                                to: parseInt(t, 10)
                            };
                        }
                        if (l) {
                            _anim.attributes.left = {
                                to: parseInt(l, 10)
                            };
                        }
                    }

                    if (this._wrap != this.get('element')) {
                        _anim.onTween.subscribe(function() {
                            this.get('element').style.height = el.style.height;
                            this.get('element').style.width = el.style.width;
                        }, this, true);
                    }

                    _anim.onComplete.subscribe(function() {
                        YAHOO.log('Animation onComplete fired', 'info', 'Resize');
                        this.set('height', h);
                        this.set('width', w);
                        this.fireEvent('resize', { ev: 'resize', target: this, height: h, width: w, top: t, left: l });
                    }, this, true);
                    _anim.animate();

                }
            } else {
                if (this._proxy && !force) {
                    YAHOO.log('proxyResize', 'info', 'Resize');
                    this.fireEvent('proxyResize', { ev: 'proxyresize', target: this, height: h, width: w, top: t, left: l });
                } else {
                    YAHOO.log('resize', 'info', 'Resize');
                    this.fireEvent('resize', { ev: 'resize', target: this, height: h, width: w, top: t, left: l });
                }
            }
            return this;
        },
        /** 
        * @private
        * @method _handle_for_br
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Bottom Right handle.
        */
        _handle_for_br: function(ev, args) {
            YAHOO.log('Handle BR', 'info', 'Resize');
            var newW = this._setWidth(args[0].e);
            var newH = this._setHeight(args[0].e);
            this.resize(args[0].e, newH, newW, 0, 0);
        },
        /** 
        * @private
        * @method _handle_for_bl
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Bottom Left handle.
        */
        _handle_for_bl: function(ev, args) {
            YAHOO.log('Handle BL', 'info', 'Resize');
            var newW = this._setWidth(args[0].e, true);
            var newH = this._setHeight(args[0].e);
            var l = (newW - this._cache.width);
            this.resize(args[0].e, newH, newW, 0, l);
        },
        /** 
        * @private
        * @method _handle_for_tl
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Top Left handle.
        */
        _handle_for_tl: function(ev, args) {
            YAHOO.log('Handle TL', 'info', 'Resize');
            var newW = this._setWidth(args[0].e, true);
            var newH = this._setHeight(args[0].e, true);
            var t = (newH - this._cache.height);
            var l = (newW - this._cache.width);
            this.resize(args[0].e, newH, newW, t, l);
        },
        /** 
        * @private
        * @method _handle_for_tr
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Top Right handle.
        */
        _handle_for_tr: function(ev, args) {
            YAHOO.log('Handle TR', 'info', 'Resize');
            var newW = this._setWidth(args[0].e);
            var newH = this._setHeight(args[0].e, true);
            var t = (newH - this._cache.height);
            this.resize(args[0].e, newH, newW, t, 0);
        },
        /** 
        * @private
        * @method _handle_for_r
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Right handle.
        */
        _handle_for_r: function(ev, args) {
            YAHOO.log('Handle R', 'info', 'Resize');
            this._dds.r.setYConstraint(0,0);
            var newW = this._setWidth(args[0].e);
            var newH = this._setHeight(args[0].e);
            this.resize(args[0].e, 0, newW, 0, 0);
        },
        /** 
        * @private
        * @method _handle_for_l
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Left handle.
        */
        _handle_for_l: function(ev, args) {
            YAHOO.log('Handle L', 'info', 'Resize');
            this._dds.l.setYConstraint(0,0);
            var newW = this._setWidth(args[0].e, true);
            var l = (newW - this._cache.width);
            this.resize(args[0].e, 0, newW, 0, l);
        },
        /** 
        * @private
        * @method _handle_for_b
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Bottom handle.
        */
        _handle_for_b: function(ev, args) {
            YAHOO.log('Handle B', 'info', 'Resize');
            this._dds.b.setXConstraint(0,0);
            var newH = this._setHeight(args[0].e);
            this.resize(args[0].e, newH, 0, 0, 0);
        },
        /** 
        * @private
        * @method _handle_for_t
        * @param {Event} ev The CustomEvent.
        * @param {Object} args The arguments from the CustomEvent.
        * @description Handles the sizes for the Top handle.
        */
        _handle_for_t: function(ev, args) {
            YAHOO.log('Handle T', 'info', 'Resize');
            this._dds.t.setXConstraint(0,0);
            var newH = this._setHeight(args[0].e, true);
            var t = (newH - this._cache.height);
            this.resize(args[0].e, newH, 0, t, 0);
        },
        /** 
        * @private
        * @method _setWidth
        * @param {Event} ev The mouse event.
        * @param {Boolean} flip Argument to determine the direction of the movement.
        * @description Calculates the width based on the mouse event.
        * @return Number
        */
        _setWidth: function(ev, flip) {
            YAHOO.log('Set width based on Event', 'info', 'Resize');
            var xy = this._cache.xy[0],
                w = this._cache.width,
                x = Event.getPageX(ev),
                nw = (x - xy);

                if (flip) {
                    nw = (xy - x) + parseInt(this.get('width'), 10);
                }
                
                nw = this._snapTick(nw, this.get('yTicks'));
                nw = this._checkWidth(nw);
            return nw;
        },
        /** 
        * @private
        * @method _checkWidth
        * @param {Number} w The width to check.
        * @description Checks the value passed against the maxWidth and minWidth.
        */
        _checkWidth: function(w) {
            YAHOO.log('Checking the min/max width', 'info', 'Resize');
            if (this.get('minWidth')) {
                if (w <= this.get('minWidth')) {
                    YAHOO.log('Using minWidth', 'info', 'Resize');
                    w = this.get('minWidth');
                }
            }
            if (this.get('maxWidth')) {
                if (w >= this.get('maxWidth')) {
                    YAHOO.log('Using Max Width', 'info', 'Resize');
                    w = this.get('maxWidth');
                }
            }
            return w;
        },
        /** 
        * @private
        * @method _checkHeight
        * @param {Number} h The height to check.
        * @description Checks the value passed against the maxHeight and minHeight.
        */
        _checkHeight: function(h) {
            YAHOO.log('Checking the min/max height', 'info', 'Resize');
            if (this.get('minHeight')) {
                if (h <= this.get('minHeight')) {
                    YAHOO.log('Using minHeight', 'info', 'Resize');
                    h = this.get('minHeight');
                }
            }
            if (this.get('maxHeight')) {
                if (h >= this.get('maxHeight')) {
                    YAHOO.log('using maxHeight', 'info', 'Resize');
                    h = this.get('maxHeight');
                }
            }
            return h;
        },
        /** 
        * @private
        * @method _setHeight
        * @param {Event} ev The mouse event.
        * @param {Boolean} flip Argument to determine the direction of the movement.
        * @description Calculated the height based on the mouse event.
        */
        _setHeight: function(ev, flip) {
            YAHOO.log('Setting the height based on the Event', 'info', 'Resize');
            var xy = this._cache.xy[1],
                h = this._cache.height,
                y = Event.getPageY(ev),
                nh = (y - xy);

                if (flip) {
                    nh = (xy - y) + parseInt(this.get('height'), 10);
                }
                nh = this._snapTick(nh, this.get('xTicks'));
                nh = this._checkHeight(nh);
                
            return nh;
        },
        /** 
        * @private
        * @method _snapTick
        * @param {Number} size The size to tick against.
        * @param {Number} pix The tick pixels.
        * @description Adjusts the number based on the ticks used.
        */
        _snapTick: function(size, pix) {
            YAHOO.log('Snapping to ticks', 'info', 'Resize');
            if (!size || !pix) {
                return size;
            }
            var _s = size;
            var _x = size % pix;
            if (_x > 0) {
                if (_x > (pix / 2)) {
                    _s = size + (pix - _x);
                } else {
                    _s = size - _x;
                }
            }
            return _s;
        },
        /** 
        * @method init
        * @description The Resize class's initialization method
        */        
        init: function(p_oElement, p_oAttributes) {
            YAHOO.log('init', 'info', 'Resize');
            this._cache = {
                xy: [],
                height: 0,
                width: 0,
                top: 0,
                left: 0,
                offsetHeight: 0,
                offsetWidth: 0,
                start: {
                    height: 0,
                    width: 0,
                    top: 0,
                    left: 0
                }
            };

            Resize.superclass.init.call(this, p_oElement, p_oAttributes);
            if (p_oAttributes.height) {
                this.set('height', parseInt(p_oAttributes.height, 10));
            }
            if (p_oAttributes.width) {
                this.set('width', parseInt(p_oAttributes.width, 10));
            }
            
            var id = p_oElement;
            if (!Lang.isString(id)) {
                id = Dom.generateId(id);
            }
            Resize._instances[id] = this;

            this._active = false;
            
            this._createWrap();
            this._createProxy();
            this._createHandles();

        },
        /**
        * @method getProxyEl
        * @description Get the HTML reference for the proxy, returns null if no proxy.
        * @return HTMLElement
        */      
        getProxyEl: function() {
            return this._proxy;
        },
        /**
        * @method getWrapEl
        * @description Get the HTML reference for the wrap element, returns the current element if not wrapped.
        * @return HTMLElement
        */      
        getWrapEl: function() {
            return this._wrap;
        },
        /**
        * @method getStatusEl
        * @description Get the HTML reference for the status element.
        * @return HTMLElement
        */      
        getStatusEl: function() {
            return this._status;
        },
        /**
        * @method getActiveHandleEl
        * @description Get the HTML reference for the currently active resize handle.
        * @return HTMLElement
        */      
        getActiveHandleEl: function() {
            return this._handles[this._currentHandle];
        },
        /**
        * @method isActive
        * @description Returns true or false if a resize operation is currently active on the element.
        * @return Boolean
        */      
        isActive: function() {
            return ((this._active) ? true : false);
        },
        /**
        * @method initAttributes
        * @description Initializes all of the configuration attributes used to create a resizable element.
        * @param {Object} attr Object literal specifying a set of 
        * configuration attributes used to create the utility.
        */      
        initAttributes: function(attr) {
            Resize.superclass.initAttributes.call(this, attr);

            /**
            * @attribute wrap
            * @description Should we wrap the element
            * @type Boolean
            */
            this.setAttributeConfig('wrap', {
                writeOnce: true,
                validator: YAHOO.lang.isBoolean,
                value: attr.wrap || false
            });

            /**
            * @attribute handles
            * @description The handles to use (any combination of): 't', 'b', 'r', 'l', 'bl', 'br', 'tl', 'tr'. Defaults to: ['r', 'b', 'br'].
            * Can use a shortcut of All. Note: 8 way resizing should be done on an element that is absolutely positioned.
            * @type Array
            */
            this.setAttributeConfig('handles', {
                writeOnce: true,
                value: attr.handles || ['r', 'b', 'br'],
                validator: function(handles) {
                    if (Lang.isString(handles) && handles.toLowerCase() == 'all') {
                        handles = ['t', 'b', 'r', 'l', 'bl', 'br', 'tl', 'tr'];
                    }
                    if (!Lang.isArray(handles)) {
                        handles = handles.replace(/, /g, ',');
                        handles = handles.split(',');
                    }
                    this._configs.handles.value = handles;
                }
            });

            /**
            * @attribute width
            * @description The width of the element
            * @type Number
            */
            this.setAttributeConfig('width', {
                value: attr.width || parseInt(this.getStyle('width'), 10),
                validator: YAHOO.lang.isNumber,
                method: function(width) {
                    width = parseInt(width, 10);
                    this.setStyle('width', width + 'px');
                    this._cache.width = width;
                    this._configs.width.value = width;
                }
            });

            /**
            * @attribute height
            * @description The height of the element
            * @type Number
            */
            this.setAttributeConfig('height', {
                value: attr.height || parseInt(this.getStyle('height'), 10),
                validator: YAHOO.lang.isNumber,
                method: function(height) {
                    height = parseInt(height, 10);
                    this.setStyle('height', height + 'px');
                    this._cache.height = height;
                    this._configs.height.value = height;
                }
            });

            /**
            * @attribute minWidth
            * @description The minimum width of the element
            * @type Number
            */
            this.setAttributeConfig('minWidth', {
                value: attr.minWidth || 15,
                validator: YAHOO.lang.isNumber
            });

            /**
            * @attribute minHeight
            * @description The minimum height of the element
            * @type Number
            */
            this.setAttributeConfig('minHeight', {
                value: attr.minHeight || 15,
                validator: YAHOO.lang.isNumber
            });

            /**
            * @attribute maxWidth
            * @description The maximum width of the element
            * @type Number
            */
            this.setAttributeConfig('maxWidth', {
                value: attr.maxWidth || 10000,
                validator: YAHOO.lang.isNumber
            });

            /**
            * @attribute maxHeight
            * @description The maximum height of the element
            * @type Number
            */
            this.setAttributeConfig('maxHeight', {
                value: attr.maxHeight || 10000,
                validator: YAHOO.lang.isNumber
            });

            /**
            * @attribute minY
            * @description The minimum y coord of the element
            * @type Number
            */
            this.setAttributeConfig('minY', {
                value: attr.minY || false
            });

            /**
            * @attribute minX
            * @description The minimum x coord of the element
            * @type Number
            */
            this.setAttributeConfig('minX', {
                value: attr.minX || false
            });
            /**
            * @attribute maxY
            * @description The max y coord of the element
            * @type Number
            */
            this.setAttributeConfig('maxY', {
                value: attr.maxY || false
            });

            /**
            * @attribute maxX
            * @description The max x coord of the element
            * @type Number
            */
            this.setAttributeConfig('maxX', {
                value: attr.maxX || false
            });

            /**
            * @attribute animate
            * @description Should be use animation to resize the element (can only be used if we use proxy).
            * @type Boolean
            */
            this.setAttributeConfig('animate', {
                value: attr.animate || false,
                validator: function(value) {
                    var ret = true;
                    if (!YAHOO.util.Anim) {
                        ret = false;
                    }
                    return ret;
                }               
            });

            /**
            * @attribute animateEasing
            * @description The Easing to apply to the animation.
            * @type Object
            */
            this.setAttributeConfig('animateEasing', {
                value: attr.animateEasing || function() {
                    var easing = false;
                    try {
                        easing = YAHOO.util.Easing.easeOut;
                    } catch (e) {}
                    return easing;
                }()
            });

            /**
            * @attribute animateDuration
            * @description The Duration to apply to the animation.
            * @type Number
            */
            this.setAttributeConfig('animateDuration', {
                value: attr.animateDuration || 0.5
            });

            /**
            * @attribute proxy
            * @description Resize a proxy element instead of the real element.
            * @type Boolean
            */
            this.setAttributeConfig('proxy', {
                value: attr.proxy || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute ratio
            * @description Maintain the element's ratio when resizing.
            * @type Boolean
            */
            this.setAttributeConfig('ratio', {
                value: attr.ratio || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute ghost
            * @description Apply an opacity filter to the element being resized (only works with proxy).
            * @type Boolean
            */
            this.setAttributeConfig('ghost', {
                value: attr.ghost || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute draggable
            * @description A convienence method to make the element draggable
            * @type Boolean
            */
            this.setAttributeConfig('draggable', {
                value: attr.draggable || false,
                validator: YAHOO.lang.isBoolean,
                method: function(dd) {
                    if (dd && this._wrap) {
                        this._setupDragDrop();
                    } else {
                        if (this.dd) {
                            Dom.removeClass(this._wrap, this.CSS_DRAG);
                            this.dd.unreg();
                        }
                    }
                }
            });

            /**
            * @attribute hover
            * @description Only show the handles when they are being moused over.
            * @type Boolean
            */
            this.setAttributeConfig('hover', {
                value: attr.hover || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute hiddenHandles
            * @description Don't show the handles, just use the cursor to the user.
            * @type Boolean
            */
            this.setAttributeConfig('hiddenHandles', {
                value: attr.hiddenHandles || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute knobHandles
            * @description Use the smaller handles, instead if the full size handles.
            * @type Boolean
            */
            this.setAttributeConfig('knobHandles', {
                value: attr.knobHandles || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute xTicks
            * @description The number of x ticks to span the resize to.
            * @type Number or False
            */
            this.setAttributeConfig('xTicks', {
                value: attr.xTicks || false
            });

            /**
            * @attribute yTicks
            * @description The number of y ticks to span the resize to.
            * @type Number or False
            */
            this.setAttributeConfig('yTicks', {
                value: attr.yTicks || false
            });

            /**
            * @attribute status
            * @description Show the status (new size) of the resize.
            * @type Boolean
            */
            this.setAttributeConfig('status', {
                value: attr.status || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute autoRatio
            * @description Using the shift key during a resize will toggle the ratio config.
            * @type Boolean
            */
            this.setAttributeConfig('autoRatio', {
                value: attr.autoRatio || false,
                validator: YAHOO.lang.isBoolean
            });

            /**
            * @attribute setSize
            * @description Set the size of the resized element, if set to false the element will not be auto resized,
            * the resize event will contain the dimensions so the end user can resize it on their own.
            * This setting will only work with proxy set to true and animate set to false.
            * @type Boolean
            */
            this.setAttributeConfig('setSize', {
                value: ((attr.setSize === false) ? false : true),
                validator: YAHOO.lang.isBoolean
            });

        },
        /**
        * @method destroy
        * @description Destroys the resize object and all of it's elements & listeners.
        */        
        destroy: function() {
            YAHOO.log('Destroying Resize', 'info', 'Resize');
            for (var h in this._handles) {
                if (Lang.hasOwnProperty(this._handles, h)) {
                    Event.purgeElement(this._handles[h]);
                    this._handles[h].parentNode.removeChild(this._handles[h]);
                }
            }
            if (this._proxy) {
                this._proxy.parentNode.removeChild(this._proxy);
            }
            if (this.dd) {
                this.dd.unreg();
                Dom.removeClass(this._wrap, this.CSS_DRAG);
            }
            if (this._wrap != this.get('element')) {
                this.setStyle('position', '');
                this.setStyle('top', '');
                this.setStyle('left', '');
                this._wrap.parentNode.replaceChild(this.get('element'), this._wrap);
            }
            this.removeClass(this.CSS_RESIZE);

            delete YAHOO.util.Resize._instances[this.get('id')];
            //Brutal Object Destroy
            for (var i in this) {
                if (Lang.hasOwnProperty(this, i)) {
                    this[i] = null;
                    delete this[i];
                }
            }
        },
        /**
        * @method toString
        * @description Returns a string representing the Resize Object.
        * @return {String}
        */        
        toString: function() {
            if (this.get) {
                return 'Resize (#' + this.get('id') + ')';
            }
            return 'Resize Utility';
        }
    });

    YAHOO.util.Resize = Resize;
 
/**
* @event dragEvent
* @description Fires when the DragDrop dragEvent is fired for the config option draggable.
* @type YAHOO.util.CustomEvent
*/
/**
* @event startResize
* @description Fires when when a resize action is started.
* @type YAHOO.util.CustomEvent
*/
/**
* @event resize
* @description Fires on every element resize (only fires once when used with proxy config setting).
* @type YAHOO.util.CustomEvent
*/
/**
* @event beforeResize
* @description Fires before every element resize after the size calculations, returning false will stop the resize.
* @type YAHOO.util.CustomEvent
*/
/**
* @event proxyResize
* @description Fires on every proxy resize (only fires when used with proxy config setting).
* @type YAHOO.util.CustomEvent
*/

})();

YAHOO.register("resize", YAHOO.util.Resize, {version: "@VERSION@", build: "@BUILD@"});