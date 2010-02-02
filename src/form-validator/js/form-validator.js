(function(){
    var Y = YAHOO,
    YL = Y.lang,
    YU = Y.util,
    YE = YU.Event,
    YW = Y.widget,
    YD = YU.Dom;
    /**
     * This is the main class of the form validator and is responsible for configuring
     * validators and indicators based on the settings given.
     */
    function FormValidator(el,config){
        FormValidator.superclass.constructor.apply(this,arguments);
        this._init(config)
    }

    YL.augmentObject(FormValidator,{
        ATTRS:{
            defaultSettings:{
                value:null
            }
        },
        /**
         * The maximum value for an integer.  Used as a default min/max value on number fields
         * @property MAX_INTEGER
         * @type number
         * @static
         */
        MAX_INTEGER:2147483647,
        /**
         * Regular expression used by the Integer field for ensuring the input matches the format of an integer
         * @property INTEGERREGEX
         * @type regex
         * @static
         */
        INTEGERREGEX:/(^-?\d\d*\.\d*$)|(^-?\d\d*$)|(^-?\.\d\d*$)/,
        /**
         * Regular expression used by the DoubleField for ensuring the input matches the format of an double
         * @property DOUBLEREGEX
         * @type regex
         * @static
         */
        DOUBLEREGEX:/(^-?\d\d*\.\d+$)|(^-?\d\d*$)|(^-?\.\d\d*$)/,
        /**
         * Regular expression for an e-mail.
         * @property EMAILREGEX
         * @type regex
         * @static
         */
        EMAILREGEX:/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,        
        /**
         * Static function that will set a boolean value for a property
         * @method BOOLEANSETTER
         * @static
         * @param {boolean|string} val value of yes/no/true/false
         * @return {boolean} a boolean
         */
        _setBoolean:function(val){
            if (YL.isBoolean(val)){
                return val;
            }
            else if (YL.isString(val)){
                return val.toLowerCase() == 'true';
            }
            else{
                return val !== null && val !== undefined;
            }
        }
    });
    Y.extend(FormValidator,YW.FormElement,{
        /**
         * This will initialize the form validator
         * @constructor
         */
        _init:function(config){
            this._initializeSubmitButtons();
            this._initializeInputs(config);
            this._initializeEvents();
            this.updateForm();
        },
        /**
         * This will hold all inputs that have validation applied to them
         * within the form.
         * @property _validation
         * @type YAHOO.widget.Validator[]
         * @protected
         */
        _validation:null,
        /**
         * Given the indicatorEl and the inputEl, this will ensure that the indicator El
         * exists in the dom, and if not, has it created using the creation attributes
         * located in the default settings of the form validator, as well as the given createAtts
         * parameter.
         * @method setupDomItem.
         * @param {HTMLElement|String} indicatorEl Element, or id of element that is to act as an indicator
         * @param {HTMLElement} inputEl Input element, this is used if the indicatorEl needs to be created.  The indicator el is placed beside this el.
         * @param {Object} createAtts Attributes used to create the indicatorEl if it needs to be created.
         */
        _setupDomItem:function(indicatorEl,inputEl,createAtts){
            var theDom = indicatorEl,defaultSettings = this.get('defaultSettings'),html,className,indicatorType = 'span';
            if (defaultSettings && defaultSettings.indicator){
                html = defaultSettings.indicator.html;
                if (!html){
                    html = '&nbsp;';
                }
                className = defaultSettings.indicator.className;                
                if (defaultSettings.indicator.tagType){
                    indicatorType = defaultSettings.indicator.tagType;
                }
            }
            // TODO: Check atts for settings used to create indicator.
            if (createAtts){
                if (createAtts.html){
                    html = createAtts.html;
                }
                if (createAtts.className){
                    className = createAtts.className;
                }
                if (createAtts.indicatorType){
                    indicatorType = createAtts.indicatorType;
                }
            }
            if (YL.isString(theDom)){
                theDom = YD.get(theDom);
                if (theDom){

                    // if there are creation atts attached, use those, but do not use
                    // the defaults
                    if (createAtts){
                        if (createAtts.html){
                            theDom.innerHTML = createAtts.html;
                        }
                        if (createAtts.className){
                            theDom.className = createAtts.className;
                        }
                    }
                    return theDom;
                }
            }
            // create the dom element, and then insert it beside the input dom.
            if (!theDom){
                theDom = document.createElement(indicatorType);
                if (indicatorEl){
                    theDom.id = indicatorEl;
                }
                YD.insertAfter(theDom,inputEl);                
            }
            if (!YL.isFunction(html)){
                theDom.innerHTML = html;
            }
            if ((theDom.className === '' || !theDom.className) && className){
                theDom.className = className;
            }
            return theDom;
        },
        /**
         * This will initialize all the inputs given in the configuration.
         * For each input in the configuration, this will initialize the validation on
         * the input field, then register the indicators with the events specified in
         * the configuration.  Indicators elements will be created as neccessary
         *
         * config.inputs
         */
        _initializeInputs:function(config){
            var inputs = config.inputs,curInput,j,curIndsJson,inds,key,indicatorKey,el,inputCfg,ind,tempCfg;
            this._validation = [];
            this._indicators = [];
            for (key in inputs){
                el = YD.get(key);
                inputCfg = inputs[key];
                // TODO: put in group support
                if (YL.isFunction(inputCfg.validation)){
                    curInput = new YAHOO.widget.FieldValidator(el,{
                        type:inputCfg.validation
                        });
                }
                else if (YL.isObject(inputCfg.validation)){
                    curInput = new YAHOO.widget.FieldValidator(el,inputCfg.validation);
                }
                else {
                    curInput = new YAHOO.widget.FieldValidator(el,{
                        type:inputCfg.validation
                        });
                }
                // NOT needed as we are using event delegation now.
                //curInput.subscribe('inputValueChange',this._onFormChange,this,true);
                inds = inputCfg.indicators;
                // singular, will subscribe to just the input change event
                if (inds instanceof YW.FieldIndicator){
                    // if just an indicator is given, it is automatically subscribed to all
                    this._initializeIndicator('all',curInput,inds);
                }
                else{
                    for (indicatorKey in inds){
                        curIndsJson = inds[indicatorKey];
                        if (YL.isArray(curIndsJson)){
                            for (j = 0 ; j < curIndsJson.length; ++j){
                                this._initializeIndicator(indicatorKey,curInput,curIndsJson[j]);
                            }
                        }
                        else{
                            this._initializeIndicator(indicatorKey,curInput,curIndsJson);
                        }
                    }
                }

                ind = inputCfg.indicator;
                if (ind){
                    if (ind instanceof YW.FieldIndicator){
                        // if just an indicator is given, it is automatically subscribed to all
                        this._initializeIndicator('all',curInput,ind);
                    }
                    else{
                        if (YL.isArray(ind)){
                            for (j = 0 ; j < ind.length; ++j){
                                this._initializeIndicator('invalid',curInput,ind[j]);
                            }
                        }
                        else{
                            this._initializeIndicator('invalid',curInput,ind);
                        }
                    }
                }

                
                this._validation.push(curInput);
            }
        },
        _initializeIndicator:function(eventSetting,fieldValidator,indJson){
            var indicator,events = FormValidator.FormEvents[eventSetting].call();
            if (indJson instanceof YW.FieldIndicator){
                indicator = indJson;
            }
            else{
                indicator = new YW.FieldIndicator(fieldValidator.get('element'),indJson)
            }
//            else{
//                // Possibly could detect leading # sign and take it as an id... not sure
//                // how events would work though
//                if (YL.isString(curIndJson)){
//                    curIndJson = FormValidator.Indicators[curIndJson].call();
//                }
//                // create the el from the JSON markup, don't touch the JSON markup
//                // because it may be re-used later.
//                indicatorEl = this._setupDomItem(curIndJson.el,fieldValidator.get('element'),curIndJson);
//                indicator = new YW.FieldIndicator(indicatorEl,curIndJson);
//            }
            this._registerIndicators(fieldValidator,indicator,events);
            this._indicators.push(indicator);
        },
        /**
         * This will intialize the an indicator based ont he given json.  The input
         * is the validation object attach to the form's input field.
         */
        //        _initializeIndicator:function(inputValidation,indJson){
        //            var indicator,curIndJson = indJson,indicatorEl,events;
        //            if (indJson instanceof YW.FieldIndicator){
        //                indicator = curIndJson;
        //                events = indicator.get('events');
        //            }
        //            else{
        //                // Possibly could detect leading # sign and take it as an id... not sure
        //                // how events would work though
        //                if (YL.isString(indJson)){
        //                    curIndJson = FormValidator.Indicators[curIndJson];
        //                }
        //                if (YL.isString(curIndJson.events)){
        //                    events = FormValidator.FormEvents[curIndJson.events];
        //                }
        //                else{
        //                    events = curIndJson.events;
        //                }
        //
        //                // create the el from the JSON markup, don't touch the JSON markup
        //                // because it may be re-used later.
        //                indicatorEl = this._setupDomItem(curIndJson.el,inputValidation.get('element'),curIndJson.atts);
        //                indicator = new YW.FieldIndicator(indicatorEl,curIndJson.atts);
        //            }
        //            this._registerIndicators(inputValidation,indicator,events);
        //            this._indicators.push(indicator);
        //        },
        /**
         * This will register and indicator with events of the validator based
         * on what was given in the configuration
         */
        _registerIndicators:function(validator,indicator,eventCfg){
            var i,methodName,method,events;
            if (!eventCfg){
                return;
            }
            for (methodName in eventCfg){
                method = indicator[methodName];
                if (!YL.isFunction(method)){
                    YAHOO.log('You can only use functions to subscribe to validator events','warn','FormValidator');
                }
                events = eventCfg[methodName];
                for (i = 0 ; i < events.length; ++i){
                    validator.subscribe(events[i],method,this,indicator);
                }
            }
        },
        /**
         * This will subscribe the form object to the submit and reset events on the form element.
         * This will enable the form to prevent form submission if the form is not filled in completely.
         * It will also allow for the form validation to update when the form is reset.
         */
        _initializeEvents:function(){
            var el = this.get('element');
            YU.Event.on(el,'submit',this._onFormSubmit,this,true);
            YU.Event.on(el,'reset',this._onFormReset,this,true);
            
            // When input values are changed
            YU.Event.on(el,'keyup',this._onFormInteraction,this,true);
            YU.Event.on(el,'blur',this._onFormInteraction,this,true);
            YU.Event.on(el,'click',this._onFormInteraction,this,true);
            YU.Event.on(el,'change',this._onFormInteraction,this,true);
        },
        /**
         * This will take all submit buttons, wrap them in a button object
         * and subscribe their enable and disable functions to the formValid and formInvalid
         * events respectively.
         */
        _initializeSubmitButtons:function(){
            var submitButtons = this._getSubmitButtons(this.get('element')),buttons = [],i,curButton;
            // TODO: Check for buttons defined in the buttonJSON attribute, and ignore buttons
            // already configured in there.
            for (i = 0 ; i < submitButtons.length; ++i){
                curButton = new YAHOO.widget.FormButton(submitButtons[i]);
                buttons.push(curButton);
                this.subscribe('formValid',curButton.enable,curButton,true);
                this.subscribe('formInvalid',curButton.disable,curButton,true);
            }
            this.set('buttons',buttons);
        },
        /**
         * This will retreive all submit buttons that are inside of the Form element and return them.
         */
        _getSubmitButtons:function(parent){
            var rtVl = [],children,i;
            if (parent.tagName && (parent.tagName.toLowerCase() == 'input') && (parent.type == 'submit')){
                return [parent];
            }
            children = YD.getChildren(parent)
            for (i = 0 ; i < children.length; ++i){
                rtVl = rtVl.concat(this._getSubmitButtons(children[i]));
            }
            return rtVl;
        },
        /**
         * This will cause all the indicators and validators to update to the proper display value
         */
        updateForm:function(){
            var vals = this._validation,i,isValid = true;
            for (i = 0 ; i < vals.length; ++i){
                if (!vals[i].validate()){
                    isValid = false;
                }
            }
            if (isValid){
                this.fireEvent('formValid');
            }
            else{
                this.fireEvent('formInvalid');
            }
        },
        /**
         * This will return true if the WHOLE form is valid.
         */
        isValid:function(){
            var i,validation = this._validation;
            for (i = 0 ; i < validation.length; ++i){
                if (!validation[i].isValid()) return false;
            }
            return true;
        },
        /**
         * This will be called whenever the form is changed.
         */
        _onFormChange:function(){
            if (this.isValid()){
                this.fireEvent('formValid');
            }
            else{
                this.fireEvent('formInvalid');
            }
            this.fireEvent('onFormChange');
        },
        _onFormSubmit:function(ev){
            if (!this.isValid()){
                YE.preventDefault(ev);
                return;
            }
            // later add the before submit function checks as well
            // as the before submit event
            this.fireEvent('onFormSubmit');
        },
        /**
         * This will be the event delgator.  Whenever a user interacts with the form
         * in anyway, this will obtain the target, and delegate the event if the
         * target is a form input.
         */
        _onFormInteraction:function(evt){
            var event = evt || window.event,target = event.target || event.srcElement,validator = this.getValidatorByInput(target);
            if (validator){
                validator.validate();
                this._onFormChange();
            }
        },
        /**
         * Given an input DOM, this will return the field's validation object
         */
        getValidatorByInput:function(dom){
            var vs = this._validation,i;
            for (i = 0; i < vs.length; ++i){
                if (vs[i].get('element') == dom) return vs[i];
            }
            return null;
        },
        /**
         * This will get called when the form is reset, this will cause the form to recheck all it's values
         * and show the proper indicators.
         * @method _onFormReset
         * @param {Event} ev Event that caused the reset.
         */
        _onFormReset:function(ev){
            var that = this;
            setTimeout(function(){
                that.updateForm();
            },100);
            this.updateForm();
        }
    });
    YAHOO.widget.FormValidator = FormValidator;
})();