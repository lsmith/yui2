/**
 * The Event Utility provides utilities for managing DOM Events and tools
 * for building event systems
 *
 * @module event
 * @title Event Utility
 * @namespace YAHOO.util
 * @requires yahoo
 */

// The first instance of Event will win if it is loaded more than once.
// @TODO this needs to be changed so that only the state data that needs to
// be preserved is kept, while methods are overwritten/added as needed.
// This means that the module pattern can't be used.
if (!YAHOO.util.Event) {

/**
 * The event utility provides functions to add and remove event listeners,
 * event cleansing.  It also tries to automatically remove listeners it
 * registers during the unload event.
 *
 * @class Event
 * @static
 */
    (function () {
            // shortcuts
        var isString = YAHOO.lang.isString,
            doc = document,
            win = window,

            /**
             * True after the onload event has fired
             * @property loadComplete
             * @type boolean
             * @static
             * @private
             */
            loadComplete =  false,

            /**
             * Cache of wrapped listeners
             * @property listeners
             * @type array
             * @static
             * @private
             */
            listeners = [],

            /**
             * User-defined unload function that will be fired before all events
             * are detached
             * @property unloadListeners
             * @type array
             * @static
             * @private
             */
            unloadListeners = [],

            /**
             * The number of times to poll after window.onload.  This number is
             * increased if additional late-bound handlers are requested after
             * the page load.
             * @property retryCount
             * @static
             * @private
             */
            retryCount = 0,

            /**
             * onAvailable listeners
             * @property onAvailStack
             * @static
             * @private
             */
            onAvailStack = [],

            /**
             * Counter for auto id generation
             * @property counter
             * @static
             * @private
             */
            counter = 0,
            
            /**
             * Normalized keycodes for webkit/safari
             * @property webkitKeymap
             * @type {int: int}
             * @private
             * @static
             * @final
             */
             webkitKeymap = {
                63232: 38, // up
                63233: 40, // down
                63234: 37, // left
                63235: 39, // right
                63276: 33, // page up
                63277: 34, // page down
                25: 9      // SHIFT-TAB (Safari provides a different key code in
                           // this case, even though the shiftKey modifier is set)
            },

            isIE = YAHOO.env.ua.ie,

            // String constants used by the addFocusListener and removeFocusListener methods
            
            FOCUSIN = "focusin",
            FOCUSOUT = "focusout",

            EventUtil = {

                /**
                 * The number of times we should look for elements that are not
                 * in the DOM at the time the event is requested after the document
                 * has been loaded.  The default is 500@amp;40 ms, so it will poll
                 * for 20 seconds or until all outstanding handlers are bound
                 * (whichever comes first).
                 * @property POLL_RETRYS
                 * @type int
                 * @static
                 * @final
                 */
                POLL_RETRYS: 500,

                /**
                 * The poll interval in milliseconds
                 * @property POLL_INTERVAL
                 * @type int
                 * @static
                 * @final
                 */
                POLL_INTERVAL: 40,

                /**
                 * Element to bind, int constant
                 * @property EL
                 * @type int
                 * @static
                 * @final
                 */
                EL: 0,

                /**
                 * Type of event, int constant
                 * @property TYPE
                 * @type int
                 * @static
                 * @final
                 */
                TYPE: 1,

                /**
                 * Function to execute, int constant
                 * @property FN
                 * @type int
                 * @static
                 * @final
                 */
                FN: 2,

                /**
                 * Function wrapped for context correction and cleanup, int constant
                 * @property WFN
                 * @type int
                 * @static
                 * @final
                 */
                WFN: 3,

                /**
                 * Object passed in by the user that will be returned as a 
                 * parameter to the callback, int constant.  Specific to
                 * unload listeners
                 * @property OBJ
                 * @type int
                 * @static
                 * @final
                 */
                UNLOAD_OBJ: 3,

                /**
                 * Adjusted context, either the element we are registering the event
                 * on or the custom object passed in by the listener, int constant
                 * @property ADJ_SCOPE
                 * @type int
                 * @static
                 * @final
                 */
                ADJ_SCOPE: 4,

                /**
                 * The original obj passed into addListener
                 * @property OBJ
                 * @type int
                 * @static
                 * @final
                 */
                OBJ: 5,

                /**
                 * The original context parameter passed into addListener
                 * @property OVERRIDE
                 * @type int
                 * @static
                 * @final
                 */
                OVERRIDE: 6,

                /**
                 * The original capture parameter passed into addListener
                 * @property CAPTURE
                 * @type int
                 * @static
                 * @final
                 */
                CAPTURE: 7,

                /**
                 * addListener/removeListener can throw errors in unexpected scenarios.
                 * These errors are suppressed, the method returns false, and this property
                 * is set
                 * @property lastError
                 * @static
                 * @type Error
                 */
                lastError: null,

                /**
                 * Safari detection
                 * @property isSafari
                 * @private
                 * @static
                 * @deprecated use YAHOO.env.ua.webkit
                 */
                isSafari: YAHOO.env.ua.webkit,
                
                /**
                 * webkit version
                 * @property webkit
                 * @type string
                 * @private
                 * @static
                 * @deprecated use YAHOO.env.ua.webkit
                 */
                webkit: YAHOO.env.ua.webkit,
                
                /**
                 * IE detection 
                 * @property isIE
                 * @private
                 * @static
                 * @deprecated use YAHOO.env.ua.ie
                 */
                isIE: isIE,

                /**
                 * poll handle
                 * @property _interval
                 * @static
                 * @private
                 */
                _interval: null,

                /**
                 * document readystate poll handle
                 * @property _dri
                 * @static
                 * @private
                 */
                 _dri: null,


                /**
                 * Map of special event types
                 * @property _specialTypes
                 * @static
                 * @private
                 */
                _specialTypes: {
                    focusin: (isIE ? "focusin" : "focus"),
                    focusout: (isIE ? "focusout" : "blur")
                },


                /**
                 * True when the document is initially usable
                 * @property DOMReady
                 * @type boolean
                 * @static
                 */
                DOMReady: false,

                /**
                 * Errors thrown by subscribers of custom events are caught
                 * and the error message is written to the debug console.  If
                 * this property is set to true, it will also re-throw the
                 * error.
                 * @property throwErrors
                 * @type boolean
                 * @default false
                 */
                throwErrors: false,


                /**
                 * @method startInterval
                 * @static
                 * @private
                 */
                startInterval: function() {
                    if (!EventUtil._interval) {
                        // var self = this;
                        // var callback = function() { self._tryPreloadAttach(); };
                        // this._interval = setInterval(callback, this.POLL_INTERVAL);
                        EventUtil._interval =
                            YAHOO.lang.later(
                                EventUtil.POLL_INTERVAL,
                                EventUtil,
                                EventUtil._tryPreloadAttach,
                                null, true);
                    }
                },

                /**
                 * Executes the supplied callback when the item with the supplied
                 * id is found.  This is meant to be used to execute behavior as
                 * soon as possible as the page loads.  If you use this after the
                 * initial page load it will poll for a fixed time for the element.
                 * The number of times it will poll and the frequency are
                 * configurable.  By default it will poll for 10 seconds.
                 *
                 * <p>The callback is executed with a single parameter:
                 * the custom object parameter, if provided.</p>
                 *
                 * @method onAvailable
                 *
                 * @param {string||string[]}   id the id of the element, or an array
                 * of ids to look for.
                 * @param {function} fn what to execute when the element is found.
                 * @param {object}   obj an optional object to be passed back as
                 *                   a parameter to fn.
                 * @param {boolean|object}  overrideContext If set to true, fn will execute
                 *                   in the context of obj, if set to an object it
                 *                   will execute in the context of that object
                 * @param checkContent {boolean} check child node readiness (onContentReady)
                 * @static
                 */
                onAvailable: function(id, fn, obj, overrideContext, checkContent) {

                    var a = (isString(id)) ? [id] : id,
                        i;

                    for ( i = 0; i < a.length; ++i ) {
                        onAvailStack.push({
                            id : a[i], 
                            fn : fn, 
                            obj: obj, 
                            overrideContext: overrideContext, 
                            checkReady     : checkContent
                        });
                    }

                    retryCount = EventUtil.POLL_RETRYS;

                    EventUtil.startInterval();
                },

                /**
                 * Works the same way as onAvailable, but additionally checks the
                 * state of sibling elements to determine if the content of the
                 * available element is safe to modify.
                 *
                 * <p>The callback is executed with a single parameter:
                 * the custom object parameter, if provided.</p>
                 *
                 * @method onContentReady
                 *
                 * @param {string}   id the id of the element to look for.
                 * @param {function} fn what to execute when the element is ready.
                 * @param {object}   obj an optional object to be passed back as
                 *                   a parameter to fn.
                 * @param {boolean|object}  overrideContext If set to true, fn will execute
                 *                   in the context of obj.  If an object, fn will
                 *                   exectute in the context of that object
                 *
                 * @static
                 */
                onContentReady: function(id, fn, obj, overrideContext) {
                    EventUtil.onAvailable(id, fn, obj, overrideContext, true);
                },

                /**
                 * Executes the supplied callback when the DOM is first usable.  This
                 * will execute immediately if called after the DOMReady event has
                 * fired.   @todo the DOMContentReady event does not fire when the
                 * script is dynamically injected into the page.  This means the
                 * DOMReady custom event will never fire in FireFox or Opera when the
                 * library is injected.  It _will_ fire in Safari, and the IE 
                 * implementation would allow for us to fire it if the defered script
                 * is not available.  We want this to behave the same in all browsers.
                 * Is there a way to identify when the script has been injected 
                 * instead of included inline?  Is there a way to know whether the 
                 * window onload event has fired without having had a listener attached 
                 * to it when it did so?
                 *
                 * <p>The callback is a CustomEvent, so the signature is:</p>
                 * <p>type &lt;string&gt;, args &lt;array&gt;, customobject &lt;object&gt;</p>
                 * <p>For DOMReady events, there are no fire argments, so the
                 * signature is:</p>
                 * <p>"DOMReady", [], obj</p>
                 *
                 *
                 * @method onDOMReady
                 *
                 * @param {function} fn what to execute when the element is found.
                 * @param {object}   obj an optional object to be passed back as
                 *                   a parameter to fn.
                 * @param {boolean|object}  overrideContext If set to true, fn will execute
                 *                   in the context of obj, if set to an object it
                 *                   will execute in the context of that object
                 *
                 * @static
                 */
                // onDOMReady: function(fn, obj, overrideContext)
                onDOMReady: function() {
                    EventUtil.DOMReadyEvent.subscribe.apply(
                        EventUtil.DOMReadyEvent, arguments);
                },


                /**
                 * Appends an event handler
                 *
                 * @method _addListener
                 *
                 * @param {String|HTMLElement|Array|NodeList} el An id, an element 
                 *  reference, or a collection of ids and/or elements to assign the 
                 *  listener to.
                 * @param {String}   sType     The type of event to append
                 * @param {Function} fn        The method the event invokes
                 * @param {Object}   obj    An arbitrary object that will be 
                 *                             passed as a parameter to the handler
                 * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
                 *                             the execution context of the listener. If an
                 *                             object, this object becomes the execution
                 *                             context.
                 * @param {boolen}      capture capture or bubble phase
                 * @return {Boolean} True if the action was successful or defered,
                 *                        false if one or more of the elements 
                 *                        could not have the listener attached,
                 *                        or if the operation throws an exception.
                 * @private
                 * @static
                 */
                _addListener: function(el, sType, fn, obj, overrideContext, bCapture) {
                    var ok = true,
                        i, len, oEl,
                        context, li, index;

                    if (!fn || !fn.call) {
                        YAHOO.log(sType + " addListener failed, invalid callback", "error", "Event");
                        return false;
                    }

                    // The el argument can be an array of elements or element ids.
                    if ( EventUtil._isValidCollection(el)) {
                        for (i=0,len=el.length; i<len; ++i) {
                            ok = EventUtil.on(el[i], 
                                           sType, 
                                           fn, 
                                           obj, 
                                           overrideContext) && ok;
                        }
                        return ok;

                    } else if (isString(el)) {
                        oEl = EventUtil.getEl(el);
                        // If the el argument is a string, we assume it is 
                        // actually the id of the element.  If the page is loaded
                        // we convert el to the actual element, otherwise we 
                        // defer attaching the event until onload event fires

                        // check to see if we need to delay hooking up the event 
                        // until after the page loads.
                        if (oEl) {
                            el = oEl;
                        } else {
                            // defer adding the event until the element is available
                            EventUtil.onAvailable(el, function() {
                               EventUtil._addListener(el, sType, fn, obj, overrideContext, bCapture);
                            });

                            return true;
                        }
                    }

                    // Element should be an html element or an array if we get 
                    // here.
                    if (!el) {
                        // this.logger.debug("unable to attach event " + sType);
                        return false;
                    }

                    // we need to make sure we fire registered unload events 
                    // prior to automatically unhooking them.  So we hang on to 
                    // these instead of attaching them to the window and fire the
                    // handles explicitly during our one unload event.
                    if ("unload" == sType && obj !== EventUtil) {
                        unloadListeners[unloadListeners.length] =
                                [el, sType, fn, obj, overrideContext];
                        return true;
                    }

                    // this.logger.debug("Adding handler: " + el + ", " + sType);

                    // if the user chooses to override the context, we use the custom
                    // object passed in, otherwise the executing context will be the
                    // HTML element that the event is registered on
                    context = el;
                    if (overrideContext) {
                        if (overrideContext === true) {
                            context = obj;
                        } else {
                            context = overrideContext;
                        }
                    }

                    // wrap the function so we can return the obj object when
                    // the event fires;
                    function wrappedFn(e) {
                        return fn.call(context, EventUtil.getEvent(e, el), 
                                obj);
                    }

                    li = [el, sType, fn, wrappedFn, context, obj, overrideContext, bCapture];
                    index = listeners.length;
                    // cache the listener so we can try to automatically unload
                    listeners[index] = li;

                    try {
                        EventUtil._simpleAdd(el, sType, wrappedFn, bCapture);
                    } catch(ex) {
                        // handle an error trying to attach an event.  If it fails
                        // we need to clean up the cache
                        EventUtil.lastError = ex;
                        EventUtil.removeListener(el, sType, fn);
                        return false;
                    }

                    return true;
                    
                },

                /**
                 * Checks to see if the type requested is a special type 
                 * (as defined by the _specialTypes hash), and (if so) returns 
                 * the special type name.
                 *
                 * @method _getType
                 *
                 * @param {String}   sType     The type to look up
                 * @private
                 */
                _getType: function (type) {
                
                    return EventUtil._specialTypes[type] || type;
                    
                },


                /**
                 * Appends an event handler
                 *
                 * @method addListener
                 *
                 * @param {String|HTMLElement|Array|NodeList} el An id, an element 
                 *  reference, or a collection of ids and/or elements to assign the 
                 *  listener to.
                 * @param {String}   sType     The type of event to append
                 * @param {Function} fn        The method the event invokes
                 * @param {Object}   obj    An arbitrary object that will be 
                 *                             passed as a parameter to the handler
                 * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
                 *                             the execution context of the listener. If an
                 *                             object, this object becomes the execution
                 *                             context.
                 * @return {Boolean} True if the action was successful or defered,
                 *                        false if one or more of the elements 
                 *                        could not have the listener attached,
                 *                        or if the operation throws an exception.
                 * @static
                 */
                addListener: function (el, sType, fn, obj, overrideContext) {

                    var capture = ((sType == FOCUSIN || sType == FOCUSOUT) && !isIE) ? true : false;

                    return EventUtil._addListener(el, EventUtil._getType(sType), fn, obj, overrideContext, capture);

                },


                /**
                 * Attaches a focusin event listener to the specified element for 
                 * the purpose of listening for the focus event on the element's 
                 * descendants.
                 * @method addFocusListener
                 *
                 * @param {String|HTMLElement|Array|NodeList} el An id, an element 
                 *  reference, or a collection of ids and/or elements to assign the 
                 *  listener to.
                 * @param {Function} fn        The method the event invokes
                 * @param {Object}   obj    An arbitrary object that will be 
                 *                             passed as a parameter to the handler
                 * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
                 *                             the execution context of the listener. If an
                 *                             object, this object becomes the execution
                 *                             context.
                 * @return {Boolean} True if the action was successful or defered,
                 *                        false if one or more of the elements 
                 *                        could not have the listener attached,
                 *                        or if the operation throws an exception.
                 * @static
                * @deprecated use YAHOO.util.Event.on and specify "focusin" as the event type.
                 */
                addFocusListener: function (el, fn, obj, overrideContext) {
                    return EventUtil.on(el, FOCUSIN, fn, obj, overrideContext);
                },          


                /**
                 * Removes a focusin event listener to the specified element for 
                 * the purpose of listening for the focus event on the element's 
                 * descendants.
                 *
                 * @method removeFocusListener
                 *
                 * @param {String|HTMLElement|Array|NodeList} el An id, an element 
                 *  reference, or a collection of ids and/or elements to remove
                 *  the listener from.
                 * @param {Function} fn the method the event invokes.  If fn is
                 *  undefined, then all event handlers for the type of event are 
                 *  removed.
                 * @return {boolean} true if the unbind was successful, false 
                 *  otherwise.
                 * @static
                 * @deprecated use YAHOO.util.Event.removeListener and specify "focusin" as the event type.
                 */
                removeFocusListener: function (el, fn) { 
                    return EventUtil.removeListener(el, FOCUSIN, fn);
                },

                /**
                 * Attaches a focusout event listener to the specified element for 
                 * the purpose of listening for the blur event on the element's 
                 * descendants.
                 *
                 * @method addBlurListener
                 *
                 * @param {String|HTMLElement|Array|NodeList} el An id, an element 
                 *  reference, or a collection of ids and/or elements to assign the 
                 *  listener to.
                 * @param {Function} fn        The method the event invokes
                 * @param {Object}   obj    An arbitrary object that will be 
                 *                             passed as a parameter to the handler
                 * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
                 *                             the execution context of the listener. If an
                 *                             object, this object becomes the execution
                 *                             context.
                 * @return {Boolean} True if the action was successful or defered,
                 *                        false if one or more of the elements 
                 *                        could not have the listener attached,
                 *                        or if the operation throws an exception.
                 * @static
                 * @deprecated use YAHOO.util.Event.on and specify "focusout" as the event type.
                 */
                addBlurListener: function (el, fn, obj, overrideContext) {
                    return EventUtil.on(el, FOCUSOUT, fn, obj, overrideContext);
                },          

                /**
                 * Removes a focusout event listener to the specified element for 
                 * the purpose of listening for the blur event on the element's 
                 * descendants.
                 *
                 * @method removeBlurListener
                 *
                 * @param {String|HTMLElement|Array|NodeList} el An id, an element 
                 *  reference, or a collection of ids and/or elements to remove
                 *  the listener from.
                 * @param {Function} fn the method the event invokes.  If fn is
                 *  undefined, then all event handlers for the type of event are 
                 *  removed.
                 * @return {boolean} true if the unbind was successful, false 
                 *  otherwise.
                 * @static
                 * @deprecated use YAHOO.util.Event.removeListener and specify "focusout" as the event type.
                 */
                removeBlurListener: function (el, fn) { 
                    return EventUtil.removeListener(el, FOCUSOUT, fn);
                },

                /**
                 * Removes an event listener
                 *
                 * @method removeListener
                 *
                 * @param {String|HTMLElement|Array|NodeList} el An id, an element 
                 *  reference, or a collection of ids and/or elements to remove
                 *  the listener from.
                 * @param {String} sType the type of event to remove.
                 * @param {Function} fn the method the event invokes.  If fn is
                 *  undefined, then all event handlers for the type of event are 
                 *  removed.
                 * @return {boolean} true if the unbind was successful, false 
                 *  otherwise.
                 * @static
                 */
                removeListener: function(el, sType, fn) {
                    var ok = true,
                        cacheItem = null,
                        index = arguments[ 3 ], // not in the sig on purpose
                        bCapture,
                        i, len, li;

                    sType = EventUtil._getType(sType);

                    // The el argument can be a string
                    if (typeof el == "string") {
                        el = EventUtil.getEl(el);
                    // The el argument can be an array of elements or element ids.
                    } else if ( EventUtil._isValidCollection(el)) {
                        for (i=el.length-1; i>-1; i--) {
                            ok = ( EventUtil.removeListener(el[i], sType, fn) && ok );
                        }
                        return ok;
                    }

                    if (!fn || !fn.call) {
                        // this.logger.debug("Error, function is not valid " + fn);
                        //return false;
                        return EventUtil.purgeElement(el, false, sType);
                    }

                    if ("unload" == sType) {

                        for (i=unloadListeners.length-1; i>-1; i--) {
                            li = unloadListeners[i];
                            if (li && 
                                li[0] == el && 
                                li[1] == sType && 
                                li[2] == fn) {
                                    unloadListeners.splice(i, 1);
                                    // unloadListeners[i]=null;
                                    return true;
                            }
                        }

                        return false;
                    }

                    if ( index === undefined ) {
                        index = EventUtil._getCacheIndex(listeners, el, sType, fn);
                    }

                    if (index >= 0) {
                        cacheItem = listeners[index];
                    }

                    if (!el || !cacheItem) {
                        // this.logger.debug("cached listener not found");
                        return false;
                    }

                    // this.logger.debug("Removing handler: " + el + ", " + sType);

                    bCapture = cacheItem[EventUtil.CAPTURE] === true ? true : false;

                    try {
                        EventUtil._simpleRemove(el, sType, cacheItem[EventUtil.WFN], bCapture);
                    } catch(ex) {
                        EventUtil.lastError = ex;
                        return false;
                    }

                    // removed the wrapped handler
                    delete listeners[index][EventUtil.WFN];
                    delete listeners[index][EventUtil.FN];
                    listeners.splice(index, 1);
                    // listeners[index]=null;

                    return true;

                },

                /**
                 * Returns the event's target element.  Safari sometimes provides
                 * a text node, and this is automatically resolved to the text
                 * node's parent so that it behaves like other browsers.
                 * @method getTarget
                 * @param {Event} ev the event
                 * @param {boolean} resolveTextNode when set to true the target's
                 *                  parent will be returned if the target is a 
                 *                  text node.  @deprecated, the text node is
                 *                  now resolved automatically
                 * @return {HTMLElement} the event's target
                 * @static
                 */
                getTarget: function(ev, resolveTextNode) {
                    var t = ev.target || ev.srcElement;
                    return EventUtil.resolveTextNode(t);
                },

                /**
                 * In some cases, some browsers will return a text node inside
                 * the actual element that was targeted.  This normalizes the
                 * return value for getTarget and getRelatedTarget.  
                 *
                 * If accessing a property of the node throws an error, this is
                 * probably the anonymous div wrapper Gecko adds inside text
                 * nodes.  This likely will only occur when attempting to access
                 * the relatedTarget.  In this case, we now return null because
                 * the anonymous div is completely useless and we do not know
                 * what the related target was because we can't even get to
                 * the element's parent node.
                 *
                 * @method resolveTextNode
                 * @param {HTMLElement} node node to resolve
                 * @return {HTMLElement} the normized node
                 * @static
                 */
                resolveTextNode: function(n) {
                    try {
                        if (n && 3 == n.nodeType) {
                            return n.parentNode;
                        }
                    } catch(e) { 
                        return null;
                    }

                    return n;
                },

                /**
                 * Returns the event's pageX
                 * @method getPageX
                 * @param {Event} ev the event
                 * @return {int} the event's pageX
                 * @static
                 */
                getPageX: function(ev) {
                    var x = ev.pageX;
                    if (!x && 0 !== x) {
                        x = ev.clientX || 0;

                        if ( isIE ) {
                            x += EventUtil._getScrollLeft();
                        }
                    }

                    return x;
                },

                /**
                 * Returns the event's pageY
                 * @method getPageY
                 * @param {Event} ev the event
                 * @return {int} the event's pageY
                 * @static
                 */
                getPageY: function(ev) {
                    var y = ev.pageY;
                    if (!y && 0 !== y) {
                        y = ev.clientY || 0;

                        if ( isIE ) {
                            y += EventUtil._getScrollTop();
                        }
                    }


                    return y;
                },

                /**
                 * Returns the pageX and pageY properties as an indexed array.
                 * @method getXY
                 * @param {Event} ev the event
                 * @return {[x, y]} the pageX and pageY properties of the event
                 * @static
                 */
                getXY: function(ev) {
                    return [EventUtil.getPageX(ev), EventUtil.getPageY(ev)];
                },

                /**
                 * Returns the event's related target 
                 * @method getRelatedTarget
                 * @param {Event} ev the event
                 * @return {HTMLElement} the event's relatedTarget
                 * @static
                 */
                getRelatedTarget: function(ev) {
                    var t = ev.relatedTarget;
                    if (!t) {
                        if (ev.type == "mouseout") {
                            t = ev.toElement;
                        } else if (ev.type == "mouseover") {
                            t = ev.fromElement;
                        }
                    }

                    return EventUtil.resolveTextNode(t);
                },

                /**
                 * Returns the time of the event.  If the time is not included, the
                 * event is modified using the current time.
                 * @method getTime
                 * @param {Event} ev the event
                 * @return {Date} the time of the event
                 * @static
                 */
                getTime: function(ev) {
                    if (!ev.time) {
                        var t = new Date().getTime();
                        try {
                            ev.time = t;
                        } catch(ex) { 
                            EventUtil.lastError = ex;
                            return t;
                        }
                    }

                    return ev.time;
                },

                /**
                 * Convenience method for stopPropagation + preventDefault
                 * @method stopEvent
                 * @param {Event} ev the event
                 * @static
                 */
                stopEvent: function(ev) {
                    EventUtil.stopPropagation(ev);
                    EventUtil.preventDefault(ev);
                },

                /**
                 * Stops event propagation
                 * @method stopPropagation
                 * @param {Event} ev the event
                 * @static
                 */
                stopPropagation: function(ev) {
                    if (ev.stopPropagation) {
                        ev.stopPropagation();
                    } else {
                        ev.cancelBubble = true;
                    }
                },

                /**
                 * Prevents the default behavior of the event
                 * @method preventDefault
                 * @param {Event} ev the event
                 * @static
                 */
                preventDefault: function(ev) {
                    if (ev.preventDefault) {
                        ev.preventDefault();
                    } else {
                        ev.returnValue = false;
                    }
                },
                 
                /**
                 * Finds the event in the window object, the caller's arguments, or
                 * in the arguments of another method in the callstack.  This is
                 * executed automatically for events registered through the event
                 * manager, so the implementer should not normally need to execute
                 * this function at all.
                 * @method getEvent
                 * @param {Event} e the event parameter from the handler
                 * @param {HTMLElement} boundEl the element the listener is attached to
                 * @return {Event} the event 
                 * @static
                 */
                getEvent: function(e, boundEl) {
                    var ev = e || win.event,
                        c;

                    if (!ev) {
                        c = EventUtil.getEvent.caller;
                        while (c) {
                            ev = c.arguments[0];
                            if (ev && Event == ev.constructor) {
                                break;
                            }
                            c = c.caller;
                        }
                    }

                    return ev;
                },

                /**
                 * Returns the charcode for an event
                 * @method getCharCode
                 * @param {Event} ev the event
                 * @return {int} the event's charCode
                 * @static
                 */
                getCharCode: function(ev) {
                    var code = ev.keyCode || ev.charCode || 0;

                    // webkit key normalization
                    if (EventUtil.webkit && (code in webkitKeymap)) {
                        code = webkitKeymap[code];
                    }
                    return code;
                },

                /**
                 * Locating the saved event handler data by function ref
                 *
                 * @method _getCacheIndex
                 * @static
                 * @private
                 */
                _getCacheIndex: function(a, el, sType, fn) {
                    var i, l, li;

                    for (i=0, l=a.length; i<l; i=i+1) {
                        li = a[i];
                        if ( li                 && 
                             li[EventUtil.FN] == fn  && 
                             li[EventUtil.EL] == el  && 
                             li[EventUtil.TYPE] == sType ) {
                            return i;
                        }
                    }

                    return -1;
                },

                /**
                 * Generates an unique ID for the element if it does not already 
                 * have one.
                 * @method generateId
                 * @param el the element to create the id for
                 * @return {string} the resulting id of the element
                 * @static
                 */
                generateId: function(el) {
                    var id = el.id;

                    if (!id) {
                        id = "yuievtautoid-" + counter;
                        ++counter;
                        el.id = id;
                    }

                    return id;
                },


                /**
                 * We want to be able to use getElementsByTagName as a collection
                 * to attach a group of events to.  Unfortunately, different 
                 * browsers return different types of collections.  This function
                 * tests to determine if the object is array-like.  It will also 
                 * fail if the object is an array, but is empty.
                 * @method _isValidCollection
                 * @param o the object to test
                 * @return {boolean} true if the object is array-like and populated
                 * @static
                 * @private
                 */
                _isValidCollection: function(o) {
                    try {
                        return ( o                     && // o is something
                                 typeof o !== "string" && // o is not a string
                                 o.length              && // o is indexed
                                 !o.tagName            && // o is not an HTML element
                                 !o.alert              && // o is not a window
                                 typeof o[0] !== "undefined" );
                    } catch(ex) {
                        YAHOO.log("node access error (xframe?)", "warn");
                        return false;
                    }

                },

                /**
                 * @private
                 * @property elCache
                 * DOM element cache
                 * @static
                 * @deprecated Elements are not cached due to issues that arise when
                 * elements are removed and re-added
                 */
                elCache: {},

                /**
                 * We cache elements bound by id because when the unload event 
                 * fires, we can no longer use document.getElementById
                 * @method getEl
                 * @static
                 * @private
                 * @deprecated Elements are not cached any longer
                 */
                getEl: function(id) {
                    return (typeof id === "string") ? doc.getElementById(id) : id;
                },

                /**
                 * Clears the element cache
                 * @deprecated Elements are not cached any longer
                 * @method clearCache
                 * @static
                 * @private
                 */
                clearCache: function() { },

                /**
                 * Custom event the fires when the dom is initially usable
                 * @event DOMReadyEvent
                 */
                DOMReadyEvent: new YAHOO.util.CustomEvent("DOMReady", YAHOO, 0, 0, 1),

                /**
                 * hook up any deferred listeners
                 * @method _load
                 * @static
                 * @private
                 */
                _load: function(e) {

                    if (!loadComplete) {
                        loadComplete = true;

                        // Just in case DOMReady did not go off for some reason
                        EventUtil._ready();

                        // Available elements may not have been detected before the
                        // window load event fires. Try to find them now so that the
                        // the user is more likely to get the onAvailable notifications
                        // before the window load notification
                        EventUtil._tryPreloadAttach();

                    }
                },

                /**
                 * Fires the DOMReady event listeners the first time the document is
                 * usable.
                 * @method _ready
                 * @static
                 * @private
                 */
                _ready: function(e) {
                    if (!EventUtil.DOMReady) {
                        EventUtil.DOMReady=true;

                        // Fire the content ready custom event
                        EventUtil.DOMReadyEvent.fire();

                        // Remove the DOMContentLoaded (FF/Opera)
                        EventUtil._simpleRemove(doc, "DOMContentLoaded", EventUtil._ready);
                    }
                },

                /**
                 * Polling function that runs before the onload event fires, 
                 * attempting to attach to DOM Nodes as soon as they are 
                 * available
                 * @method _tryPreloadAttach
                 * @static
                 * @private
                 */
                _tryPreloadAttach: function() {
                    var tryAgain, notAvail,
                        i, len, item, el, ready=[];


                    if (onAvailStack.length === 0) {
                        retryCount = 0;
                        if (EventUtil._interval) {
                            // clearInterval(this._interval);
                            EventUtil._interval.cancel();
                            EventUtil._interval = null;
                        } 
                        return;
                    }

                    if (EventUtil.locked) {
                        return;
                    }

                    if (isIE) {
                        // Hold off if DOMReady has not fired and check current
                        // readyState to protect against the IE operation aborted
                        // issue.
                        if (!EventUtil.DOMReady) {
                            EventUtil.startInterval();
                            return;
                        }
                    }

                    EventUtil.locked = true;

                    // this.logger.debug("tryPreloadAttach");

                    // keep trying until after the page is loaded.  We need to 
                    // check the page load state prior to trying to bind the 
                    // elements so that we can be certain all elements have been 
                    // tested appropriately
                    tryAgain = !loadComplete;
                    if (!tryAgain) {
                        tryAgain = (retryCount > 0 && onAvailStack.length > 0);
                    }

                    // onAvailable
                    notAvail = [];

                    function executeItem(el, item) {
                        var context = el;
                        if (item.overrideContext) {
                            if (item.overrideContext === true) {
                                context = item.obj;
                            } else {
                                context = item.overrideContext;
                            }
                        }
                        item.fn.call(context, item.obj);
                    }

                    // onAvailable onContentReady
                    for (i=0, len=onAvailStack.length; i<len; i=i+1) {
                        item = onAvailStack[i];
                        if (item) {
                            el = EventUtil.getEl(item.id);
                            if (el) {
                                if (item.checkReady) {
                                    if (loadComplete || el.nextSibling || !tryAgain) {
                                        ready.push(item);
                                        onAvailStack[i] = null;
                                    }
                                } else {
                                    executeItem(el, item);
                                    onAvailStack[i] = null;
                                }
                            } else {
                                notAvail.push(item);
                            }
                        }
                    }
                    
                    // make sure onContentReady fires after onAvailable
                    for (i=0, len=ready.length; i<len; i=i+1) {
                        item = ready[i];
                        executeItem(EventUtil.getEl(item.id), item);
                    }


                    retryCount--;

                    if (tryAgain) {
                        for (i=onAvailStack.length-1; i>-1; i--) {
                            item = onAvailStack[i];
                            if (!item || !item.id) {
                                onAvailStack.splice(i, 1);
                            }
                        }

                        EventUtil.startInterval();
                    } else {
                        if (EventUtil._interval) {
                            // clearInterval(this._interval);
                            EventUtil._interval.cancel();
                            EventUtil._interval = null;
                        }
                    }

                    EventUtil.locked = false;

                },

                /**
                 * Removes all listeners attached to the given element via addListener.
                 * Optionally, the node's children can also be purged.
                 * Optionally, you can specify a specific type of event to remove.
                 * @method purgeElement
                 * @param {HTMLElement} el the element to purge
                 * @param {boolean} recurse recursively purge this element's children
                 * as well.  Use with caution.
                 * @param {string} type optional type of listener to purge. If
                 * left out, all listeners will be removed
                 * @static
                 */
                purgeElement: function(el, recurse, type) {
                    var getSubs = EventUtil.getListeners,
                        ignore  = EventUtil.removeListener,
                        subs, descendants, dsubs, i;

                    el = ( isString( el ) ) ? EventUtil.getEl( el ) : el;

                    if ( el ) {
                        subs = getSubs( el, type );

                        if ( recurse && el.getElementsByTagName ) {
                            descendants = el.getElementsByTagName( '*' ) || [];

                            for ( i = descendants.length - 1; i >= 0; --i ) {
                                dsubs = getSubs( descendants[ i ], type );
                                if ( dsubs ) {
                                    subs.push.apply( subs, dsubs );
                                }
                            }
                        }

                        for ( i = subs.length - 1; i >= 0; --i ) {
                            ignore( el, subs[ i ].type, subs[ i ].fn );
                        }
                    }
                },

                /**
                 * Returns all listeners attached to the given element via addListener.
                 * Optionally, you can specify a specific type of event to return.
                 * @method getListeners
                 * @param el {HTMLElement|string} the element or element id to inspect 
                 * @param sType {string} optional type of listener to return. If
                 * left out, all listeners will be returned
                 * @return {Object} the listener. Contains the following fields:
                 * &nbsp;&nbsp;type:   (string)   the type of event
                 * &nbsp;&nbsp;fn:     (function) the callback supplied to addListener
                 * &nbsp;&nbsp;obj:    (object)   the custom object supplied to addListener
                 * &nbsp;&nbsp;adjust: (boolean|object)  whether or not to adjust the default context
                 * &nbsp;&nbsp;scope: (boolean)  the derived context based on the adjust parameter
                 * &nbsp;&nbsp;index:  (int)      its position in the Event util listener cache
                 * @static
                 */           
                getListeners: function(el, sType) {
                    var results = [],
                        oEl     = (isString(el)) ? EventUtil.getEl(el) : el,
                        searchLists, i, len, j, list, sub,
                        EL   = EventUtil.EL,
                        TYPE = EventUtil.TYPE,
                        FN   = EventUtil.FN,
                        OBJ  = EventUtil.OBJ,
                        OVERRIDE  = EventUtil.OVERRIDE,
                        ADJ_SCOPE = EventUtil.ADJ_SCOPE;

                    if (!sType) {
                        searchLists = [listeners, unloadListeners];
                    } else if (sType === "unload") {
                        searchLists = [unloadListeners];
                    } else {
                        sType = EventUtil._getType(sType);
                        searchLists = [listeners];
                    }

                    for ( j = 0; j < searchLists.length; ++j ) {
                        list = searchLists[ j ];
                        if ( list ) {
                            for ( i = 0, len = list.length; i < len ; ++i) {
                                sub = list[ i ];
                                if ( sub && sub[ EL ] === oEl && 
                                    (!sType || sType === sub[ TYPE ]) ) {
                                    results.push({
                                        type:   sub[ TYPE ],
                                        fn:     sub[ FN ],
                                        obj:    sub[ OBJ ],
                                        adjust: sub[ OVERRIDE ],
                                        scope:  sub[ ADJ_SCOPE ],
                                        index:  i
                                    });
                                }
                            }
                        }
                    }

                    return (results.length) ? results : null;
                },

                /**
                 * Removes all listeners registered by pe.event.  Called 
                 * automatically during the unload event.
                 * @method _unload
                 * @static
                 * @private
                 */
                _unload: function(e) {

                    var i, j, l, len, index,
                        ul = unloadListeners.slice(), context;

                    // execute and clear stored unload listeners
                    for (i=0, len=unloadListeners.length; i<len; ++i) {
                        l = ul[i];
                        if (l) {
                            context = win;
                            if (l[EventUtil.ADJ_SCOPE]) {
                                if (l[EventUtil.ADJ_SCOPE] === true) {
                                    context = l[EventUtil.UNLOAD_OBJ];
                                } else {
                                    context = l[EventUtil.ADJ_SCOPE];
                                }
                            }
                            l[EventUtil.FN].call(context, EventUtil.getEvent(e, l[EventUtil.EL]), l[EventUtil.UNLOAD_OBJ] );
                            ul[i] = null;
                        }
                    }

                    l = null;
                    context = null;
                    unloadListeners = null;

                    // Remove listeners to handle IE memory leaks
                    // 2.5.0 listeners are removed for all browsers again.  FireFox preserves
                    // at least some listeners between page refreshes, potentially causing
                    // errors during page load (mouseover listeners firing before they
                    // should if the user moves the mouse at the correct moment).
                    if (listeners) {
                        for (j=listeners.length-1; j>-1; j--) {
                            l = listeners[j];
                            if (l) {
                                EventUtil.removeListener(l[EventUtil.EL], l[EventUtil.TYPE], l[EventUtil.FN], j);
                            } 
                        }
                        l=null;
                    }

                    EventUtil._simpleRemove(win, "unload", EventUtil._unload);

                },

                /**
                 * Returns scrollLeft
                 * @method _getScrollLeft
                 * @static
                 * @private
                 */
                _getScrollLeft: function() {
                    return EventUtil._getScroll()[1];
                },

                /**
                 * Returns scrollTop
                 * @method _getScrollTop
                 * @static
                 * @private
                 */
                _getScrollTop: function() {
                    return EventUtil._getScroll()[0];
                },

                /**
                 * Returns the scrollTop and scrollLeft.  Used to calculate the 
                 * pageX and pageY in Internet Explorer
                 * @method _getScroll
                 * @static
                 * @private
                 */
                _getScroll: function() {
                    var dd = doc.documentElement, db = doc.body;
                    if (dd && (dd.scrollTop || dd.scrollLeft)) {
                        return [dd.scrollTop, dd.scrollLeft];
                    } else if (db) {
                        return [db.scrollTop, db.scrollLeft];
                    } else {
                        return [0, 0];
                    }
                },
                
                /**
                 * Used by old versions of CustomEvent, restored for backwards
                 * compatibility
                 * @method regCE
                 * @private
                 * @static
                 * @deprecated still here for backwards compatibility
                 */
                regCE: function() {},

                /**
                 * Adds a DOM event directly without the caching, cleanup, context adj, etc
                 *
                 * @method _simpleAdd
                 * @param {HTMLElement} el      the element to bind the handler to
                 * @param {string}      sType   the type of event handler
                 * @param {function}    fn      the callback to invoke
                 * @param {boolen}      capture capture or bubble phase
                 * @static
                 * @private
                 */
                _simpleAdd: function () {
                    if (win.addEventListener) {
                        return function(el, sType, fn, capture) {
                            el.addEventListener(sType, fn, (capture));
                        };
                    } else if (win.attachEvent) {
                        return function(el, sType, fn, capture) {
                            el.attachEvent("on" + sType, fn);
                        };
                    } else {
                        return function(){};
                    }
                }(),

                /**
                 * Basic remove listener
                 *
                 * @method _simpleRemove
                 * @param {HTMLElement} el      the element to bind the handler to
                 * @param {string}      sType   the type of event handler
                 * @param {function}    fn      the callback to invoke
                 * @param {boolen}      capture capture or bubble phase
                 * @static
                 * @private
                 */
                _simpleRemove: function() {
                    if (win.removeEventListener) {
                        return function (el, sType, fn, capture) {
                            el.removeEventListener(sType, fn, (capture));
                        };
                    } else if (win.detachEvent) {
                        return function (el, sType, fn) {
                            el.detachEvent("on" + sType, fn);
                        };
                    } else {
                        return function(){};
                    }
                }()
        };


        /**
         * Appends an event handler.  This is an alias for <code>addListener</code>
         *
         * @method on
         *
         * @param {String|HTMLElement|Array|NodeList} el An id, an element 
         *  reference, or a collection of ids and/or elements to assign the 
         *  listener to.
         * @param {String}   sType     The type of event to append
         * @param {Function} fn        The method the event invokes
         * @param {Object}   obj    An arbitrary object that will be 
         *                             passed as a parameter to the handler
         * @param {Boolean|object}  overrideContext  If true, the obj passed in becomes
         *                             the execution context of the listener. If an
         *                             object, this object becomes the execution
         *                             context.
         * @return {Boolean} True if the action was successful or defered,
         *                        false if one or more of the elements 
         *                        could not have the listener attached,
         *                        or if the operation throws an exception.
         * @static
         */
        EventUtil.on = EventUtil.addListener;

        /**
         * YAHOO.util.Event.onFocus is an alias for addFocusListener
         * @method onFocus
         * @see addFocusListener
         * @static
         * @deprecated use YAHOO.util.Event.on and specify "focusin" as the event type.
         */
        EventUtil.onFocus = EventUtil.addFocusListener;

        /**
         * YAHOO.util.Event.onBlur is an alias for addBlurListener
         * @method onBlur
         * @see addBlurListener
         * @static
         * @deprecated use YAHOO.util.Event.on and specify "focusout" as the event type.
         */     
        EventUtil.onBlur = EventUtil.addBlurListener;

    /*! DOMReady: based on work by: Dean Edwards/John Resig/Matthias Miller/Diego Perini */

        // Internet Explorer: use the readyState of a defered script.
        // This isolates what appears to be a safe moment to manipulate
        // the DOM prior to when the document's readyState suggests
        // it is safe to do so.
        if (isIE) {
            if (self !== self.top) {
                doc.onreadystatechange = function() {
                    if (doc.readyState == 'complete') {
                        doc.onreadystatechange = null;
                        EventUtil._ready();
                    }
                };
            } else {

                // Process onAvailable/onContentReady items when the 
                // DOM is ready.
                EventUtil.onDOMReady(
                        EventUtil._tryPreloadAttach,
                        EventUtil, true);
                
                EventUtil._dri = YAHOO.lang.later(
                    EventUtil.POLL_INTERVAL,
                    EventUtil,
                    function( tmpNode ) {
                        try {
                            // throws an error if doc is not ready
                            tmpNode.doScroll('left');
                            EventUtil._dri.cancel();
                            EventUtil._dri = null;
                            tmpNode = null;
                            EventUtil._ready();
                        } catch (ex) { 
                        }
                    }, doc.createElement( 'p' ), true );
            }

        // The document's readyState in Safari currently will
        // change to loaded/complete before images are loaded.
        } else if (EventUtil.webkit && EventUtil.webkit < 525) {

            EventUtil._dri = YAHOO.lang.later(
                EventUtil.POLL_INTERVAL,
                EventUtil,
                function() {
                    var rs = doc.readyState;
                    if ("loaded" == rs || "complete" == rs) {
                        EventUtil._dri.cancel();
                        EventUtil._dri = null;
                        EventUtil._ready();
                    }
                }, null, true );

        // FireFox and Opera: These browsers provide a event for this
        // moment.  The latest WebKit releases now support this event.
        } else {

            EventUtil._simpleAdd(doc, "DOMContentLoaded", EventUtil._ready);

        }
        /////////////////////////////////////////////////////////////


        EventUtil._simpleAdd(win, "load", EventUtil._load);
        EventUtil._simpleAdd(win, "unload", EventUtil._unload);
        EventUtil._tryPreloadAttach();

        YAHOO.util.Event = EventUtil;
    })();

}
