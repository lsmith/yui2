<!-- Example: Compact Output -->
<div class="example">
    <div id="compact" class="container"></div>
    <div class="content">
        <h4>Example: Compact Ouput</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>By default, log messages are printed to the console with a good
        deal of whitespace for better readability. In this example, verbose
        output has been disabled so each message gets output on
        a single line without wrapping.</p>

        <!-- Sample code begins -->
        <div class="code">
            <h4>Sample Code</h4>

            <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="compact"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myCompact = new YAHOO.widget.LogReader("compact", {verboseOutput:false});
myCompact.setTitle("Compact Output");
&lt;/script&gt;
&lt;/body&gt;
            </textarea>
        </div>
        <!-- Code sample ends -->
    </div>
</div>

<!-- Example: Footer Disabled -->
<div class="example">
    <div id="nofooter" class="container"></div>
    <div class="content">
        <h4>Example: Footer Disabled</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>By default, the footer displays checkboxes for easy filtration
        of log messages by category and by source, as well as buttons to
        pause/resume output and clear the console. In this example, the
        footer is hidden from the UI, but filters can still be enabled or
        disabled programmatically.</p>

        <p><a href="#" id="hideInfo">Hide "info" Category</a>
        <a href="#" id="showInfo">Show "info" Category</a></p>

        <!-- Sample code begins -->
        <div class="code">
            <h4>Sample Code</h4>

            <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="compact"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myFooterDisabled = new YAHOO.widget.LogReader("nofooter", {footerEnabled:false});
myFooterDisabled.setTitle("Footer Disabled");
&lt;/script&gt;
&lt;/body&gt;
            </textarea>
        </div>
        <!-- Code sample ends -->
    </div>
</div>

<!-- Example: Oldest On Top -->
<div class="example">
    <div id="oldestOnTop" class="container"></div>
    <div class="content">
        <h4>Example: Oldest On Top</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>By default, new messages get prepended at the top of the console.
        In this example, new messages get appended at the bottom of the
        console.</p>
    </div>


    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="oldestOnTop"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myOldestOnTop = new YAHOO.widget.LogReader("oldestOnTop", {newestOnTop:false});
myOldestOnTop.setTitle("Oldest On Top");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<!-- Example: Undraggable -->
<div class="example">
    <div id="undraggable" class="container"></div>
    <div class="content">
        <h4>Example: Undraggable</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>Although the Drag and Drop Utility is available on the page,
        draggability of this LogReader has been disabled.</p>
    </div>


    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="undraggable"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myUndraggable = new YAHOO.widget.LogReader("undraggable", {draggable:false});
myUndraggable.setTitle("Undraggable");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<!-- Example: Filtered -->
<div class="example">
    <div id="filtered" class="container"></div>
    <div class="content">
        <h4>Example: Filtered Output</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>The first LogReader will show only global info messages. The
        second LogReader will only show info messages coming from the
        "LogReader" class.</p>
    </div>


    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="filtered"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myFiltered1 = new YAHOO.widget.LogReader("filtered");
var myFiltered2 = new YAHOO.widget.LogReader("filtered");
myFiltered1.hideCategory("warn");
myFiltered1.hideCategory("error");
myFiltered1.hideCategory("time");
myFiltered1.hideCategory("window");
myFiltered2.hideCategory("warn");
myFiltered2.hideCategory("error");
myFiltered2.hideCategory("time");
myFiltered2.hideCategory("window");
myFiltered1.hideSource("LogReader");
myFiltered2.hideSource("global");
myFiltered1.setTitle("Filtered LogReader: Global Messages Only");
myFiltered2.setTitle("Filtered LogReader: LogReader Messages Only");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<!-- Example: Buffered -->
<div class="example">
    <div id="buffered" class="container"></div>
    <div class="content">
        <h4>Example: Buffered</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>Output buffer has been increased to 3 seconds. Therefore,
        messages are printed to the screen every 3 seconds.</p>
    </div>

    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="paused"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myBuffered = new YAHOO.widget.LogReader("buffered", {outputBuffer:3000});
myPaused.setTitle("3 Second Output Buffer");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<!-- Example: Paused -->
<div class="example">
    <div id="paused" class="container"></div>
    <div class="content">
        <h4>Example: Paused</h4>
        <p><a href="#" id="resume">Resume this LogReader</a> | <a href="#" id="pause">Pause this LogReader</a> | <a href="#" class="logit">Log a simple message</a></p>

        <p>Output has been paused.</p>
    </div>

    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="paused"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myPaused = new YAHOO.widget.LogReader("paused");
myPaused.pause();
myPaused.setTitle("Paused LogReader");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<!-- Example: Collapsed -->
<div class="example">
    <div id="collapsed" class="container"></div>
    <div class="content">
        <h4>Example: Collapsed</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>The LogReader console has been collapsed.</p>
    </div>

    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="collapsed"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myCollapsed = new YAHOO.widget.LogReader("collapsed");
myCollapsed.collapse();
myCollapsed.setTitle("Collapsed LogReader");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<!-- Example: Hidden -->
<div class="example">
    <div id="hidden" class="container"></div>
    <div class="content">
        <h4>Example: Hidden</h4>
        <p><a href="#" id="show">Show this LogReader</a> | <a href="#" id="hide">Hide this LogReader</a> | <a href="#" class="logit">Log a simple message</a></p>

        <p>The entire LogReader console has been hidden.</p>
    </div>

    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;body&gt;
&lt;div id="hidden"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myHidden = new YAHOO.widget.LogReader("hidden");
myHidden.hide();
myHidden.setTitle("Hidden LogReader");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<!-- Example: Styled via Custom CSS -->
<div class="example">
    <div id="styled" class="container"></div>
    <div class="content">
        <h4>Example: Styled via Custom CSS</h4>
        <p><a href="#" class="logit">Log a simple message</a></p>

        <p>The UI has been customized via custom CSS.</p>
    </div>


    <!-- Sample code begins -->
    <div class="code">
        <h4>Sample Code</h4>

        <textarea name="code" class="JScript" cols="60" rows="1">
&lt;head&gt;
&lt;style type="text/css"&gt;
#styled {font-family:verdana;}
#styled .info {background-color:blue;}
#styled .warn {background-color:green;}
#styled .error {background-color:red;}
#styled .time {background-color:orange;}
#styled .window {background-color:yellow;}
&lt;/style&gt;
&lt;/head&gt;

&lt;body&gt;
&lt;div id="styled"&gt;&lt;/div&gt;

&lt;script type="text/javascript"&gt;
var myStyled = new YAHOO.widget.LogReader("styled");
myStyled.setTitle("Styled via Custom CSS");
&lt;/script&gt;
&lt;/body&gt;
        </textarea>
    </div>
    <!-- Code sample ends -->
</div>

<script type="text/javascript">
YAHOO.util.Event.addListener(window, "load", function() {
YAHOO.example.LogReader = new function() {
    this.myCompact = new YAHOO.widget.LogReader("compact", {verboseOutput:false});
    this.myCompact.setTitle("Compact Output");

    var myFooterDisabled = new YAHOO.widget.LogReader("nofooter", {footerEnabled:false});
    myFooterDisabled.setTitle("Footer Disabled");

    var myOldestOnTop = new YAHOO.widget.LogReader("oldestOnTop", {newestOnTop:false});
    myOldestOnTop.setTitle("Oldest On Top");

    var myUndraggable = new YAHOO.widget.LogReader("undraggable", {draggable:false});
    myUndraggable.setTitle("Undraggable");

    var myFiltered1 = new YAHOO.widget.LogReader("filtered");
    var myFiltered2 = new YAHOO.widget.LogReader("filtered");
    myFiltered1.hideCategory("warn");
    myFiltered1.hideCategory("error");
    myFiltered1.hideCategory("time");
    myFiltered1.hideCategory("window");
    myFiltered2.hideCategory("warn");
    myFiltered2.hideCategory("error");
    myFiltered2.hideCategory("time");
    myFiltered2.hideCategory("window");
    myFiltered1.hideSource("LogReader");
    myFiltered2.hideSource("global");
    myFiltered1.setTitle("Filtered LogReader: Global Messages Only");
    myFiltered2.setTitle("Filtered LogReader: LogReader Messages Only");

    var myBuffered = new YAHOO.widget.LogReader("buffered", {outputBuffer:3000});
    myBuffered.setTitle("3 Second Ouput Buffer");

    var myPaused = new YAHOO.widget.LogReader("paused");
    myPaused.pause();
    myPaused.setTitle("Paused LogReader");

    var myCollapsed = new YAHOO.widget.LogReader("collapsed");
    myCollapsed.collapse();
    myCollapsed.setTitle("Collapsed LogReader");

    var myHidden = new YAHOO.widget.LogReader("hidden");
    myHidden.hide();
    myHidden.setTitle("Hidden LogReader");

    var myStyled = new YAHOO.widget.LogReader("styled");
    myStyled.setTitle("Styled via Custom CSS");

    // Click to log
    var clickToLog = function(e) {
        YAHOO.util.Event.stopEvent(e);
        YAHOO.log("This is a simple log message.");
    };
    var logitEls = YAHOO.util.Dom.getElementsByClassName("logit","a",YAHOO.util.Dom.get("bd"));
    for(var i=0; i<logitEls.length; i++) {
        YAHOO.util.Event.addListener(logitEls[i],"click",clickToLog);
    }

    // Click to hide "info" category
    var clickToHideInfo = function(e) {
        YAHOO.util.Event.stopEvent(e);
        myFooterDisabled.hideCategory("info");
    };
    var hideInfoEl = YAHOO.util.Dom.get("hideInfo");
    YAHOO.util.Event.addListener(hideInfoEl,"click",clickToHideInfo);

    // Click to show "info" category
    var clickToShowInfo = function(e) {
        YAHOO.util.Event.stopEvent(e);
        myFooterDisabled.showCategory("info");
    };
    var showInfoEl = YAHOO.util.Dom.get("showInfo");
    YAHOO.util.Event.addListener(showInfoEl,"click",clickToShowInfo);

    // Click to pause
    var clickToPause = function(e,LogReader) {
        YAHOO.util.Event.stopEvent(e);
        LogReader.pause();
    };
    YAHOO.util.Event.addListener(YAHOO.util.Dom.get("pause"),"click",clickToPause,myPaused);

    // Click to resume
    var clickToResume = function(e,LogReader) {
        YAHOO.util.Event.stopEvent(e);
        LogReader.resume();
    };
    YAHOO.util.Event.addListener(YAHOO.util.Dom.get("resume"),"click",clickToResume,myPaused);

    // Click to show
    var clickToShow = function(e,LogReader) {
        YAHOO.util.Event.stopEvent(e);
        LogReader.show();
    };
    YAHOO.util.Event.addListener(YAHOO.util.Dom.get("show"),"click",clickToShow,myHidden);

    // Click to hide
    var clickToHide = function(e,LogReader) {
        YAHOO.util.Event.stopEvent(e);
        LogReader.hide();
    };
    YAHOO.util.Event.addListener(YAHOO.util.Dom.get("hide"),"click",clickToHide,myHidden);
};
});
</script>
