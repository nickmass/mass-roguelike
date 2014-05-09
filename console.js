var MassConsole = function(rows, columns) {
    this.Rows = rows;
    this.Columns = columns;
    this.FontWidth = 7;
    this.FontHeight = 10;
    this.Width = this.FontWidth * this.Columns;
    this.Height = this.FontHeight * this.Rows;
    this.Characters = {};
    this.Frame = 0;
    this.Input = {
        Cursor: 0,
        Line: ''
    };
    this.Output = {
        Lines: new Array(rows - 1)
    };

    this._listeners = {};
};

MassConsole.prototype.init = function(targetElem) {
    var elem = document.getElementById(targetElem);
    var canvas = document.createElement('canvas');
    canvas.setAttribute('height', this.Height);
    canvas.setAttribute('width', this.Width);
    elem.appendChild(canvas);
    this.Context = canvas.getContext('2d');
    this.Context.imageSmoothingEnabled = false;
    this.BackBufferCanvas = document.createElement('canvas');
    this.BackBufferCanvas.setAttribute('height', this.Height);
    this.BackBufferCanvas.setAttribute('width', this.Width);
    this.BackBuffer = this.BackBufferCanvas.getContext('2d');
    
    document.addEventListener('keypress', this.keypress.bind(this));
    document.addEventListener('keydown', this.keydown.bind(this));
    window.requestAnimationFrame(this.renderLoop.bind(this));
    this.addEventListener('lineEntered', function(line){console.log('LINE: ' + line);});
}

MassConsole.prototype.drawCharacter = function (character, x, y, color, backColor) {
    if(typeof character !== 'string')
        return;
    if(character.length !== 1)
        return;
    if(y >= this.Rows || y < 0)
        return;
    if(x >= this.Column || x < 0)
        return;
    
    backColor = backColor || {};
    backColor.r = backColor.r || 0;
    backColor.g = backColor.g || 0;
    backColor.b = backColor.b || 0;
    var backColorString = this.colorHexString(backColor);

    color = color || {};
    color.r = color.r || color.r == 0 || 255;
    color.g = color.g || color.g == 0 || 255;
    color.b = color.b || color.b == 0 || 255;
    var colorString = this.colorHexString(color);

    var charKey = character + colorString + backColorString;

    if(!this.Characters[charKey]) {
        var cChar = document.createElement('canvas');
        cChar.setAttribute('width', this.FontWidth);
        cChar.setAttribute('height', this.FontHeight);
        var ctxChar = cChar.getContext('2d');
        ctxChar.fillStyle = backColorString; 
        ctxChar.fillRect(0, 0, this.FontWidth, this.FontHeight);
        ctxChar.fillStyle = colorString; 
        ctxChar.font = '10px monospace';
        ctxChar.fillText(character, 0, this.FontHeight - 2);
        this.Characters[charKey] = cChar;
    }

    var charX = x * this.FontWidth;
    var charY = y * this.FontHeight;

    this.BackBuffer.drawImage(this.Characters[charKey], charX, charY);
};

MassConsole.prototype.drawBox = function(x, y, width, height, color, backcolor) {
    var cornerChar = '+';
    var vertChar = '|';
    var horzChar = '-';

    this.drawCharacter(cornerChar, x, y, color, backcolor);
    this.drawCharacter(cornerChar, x + width - 1, y, color, backcolor);
    this.drawCharacter(cornerChar, x, y + height - 1, color, backcolor);
    this.drawCharacter(cornerChar, x + width - 1, y + height - 1, color, backcolor);

    for(var x1 = 1; x1 < width - 1; x1++) {
        this.drawCharacter(horzChar, x + x1, y, color, backcolor);
        this.drawCharacter(horzChar, x + x1, y + height - 1, color, backcolor);
    }

    for(var y1 = 1; y1 < height - 1; y1++) {
        this.drawCharacter(vertChar, x, y + y1, color, backcolor);
        this.drawCharacter(vertChar, x + width - 1, y + y1, color, backcolor);
    }
};

MassConsole.prototype.drawRect = function(character, x, y, width, height, fill,  color, backcolor) {
    for(var x1 = 0; x1 < width; x1++) {
        for(var y1 = 0; y1 < height; y1++) {
            if(!fill && y1 != 0 && y1 != height - 1 && x1 != 0 && x1 != width -1)
                continue;
            this.drawCharacter(character, x + x1, y + y1, color, backcolor);
        }
    }
   
};

MassConsole.prototype.clear = function(clearColor) {
    clearColor = clearColor || {};
    clearColor.r = clearColor.r || 0;
    clearColor.g = clearColor.g || 0;
    clearColor.b = clearColor.b || 0;
    var clearColorString = this.colorHexString(clearColor);
    
    this.BackBuffer.fillStyle = clearColorString;
    this.BackBuffer.fillRect(0, 0, this.Width, this.Height);
};

MassConsole.prototype.present = function() {
    this.Frame++;
    this.Context.drawImage(this.BackBufferCanvas, 0, 0);
};

MassConsole.prototype.renderLoop = function() {
    this.clear();
    for(var i = 0; i < this.Output.Lines.length; i++) {
        for(var j = 0; this.Output.Lines[i] && j < this.Output.Lines[i].length; j++)
            this.drawCharacter(this.Output.Lines[i][j], j, i);
    }
    
    this.drawRect('#', 5, 2, 4, 4, false);
    this.drawRect('@', 22, 5, 4, 4, true);
    this.drawBox(40, 10, 8, 8);

    this.drawCharacter('>', 0, this.Rows - 1);
    for(var i = 1; i <= this.Input.Line.length; i++)
        this.drawCharacter(this.Input.Line[i-1], i, this.Rows - 1);
    if(((this.Frame / 30) | 0) % 2)
        this.drawCharacter(' ', this.Input.Cursor + 1, this.Rows - 1, {r:0,g:0,b:0}, {r:255,g:255,b:255});

    this.present();

    window.requestAnimationFrame(this.renderLoop.bind(this));
};

MassConsole.prototype.addEventListener = function (eventName, callback) {
    if(!this._listeners[eventName]) {
        this._listeners[eventName] = [];
    }

    this._listeners[eventName].push(callback);
};

MassConsole.prototype.trigger = function (eventName, eventArg) {
    if(!this._listeners[eventName])
        return;

    this._listeners[eventName].forEach(function(listener) {
        listener(eventArg);
    });
};

MassConsole.prototype.keydown = function (event) {
    console.log(event.keyCode);
    switch(event.keyCode)
    {
        case 8: //Backspace
            if(this.Input.Cursor > 0) {
                this.Input.Cursor--;
                this.Input.Line = this.stringRemoveAtIndex(this.Input.Line, this.Input.Cursor);
            }
        break;
        case 46: //Delete
            if(this.Input.Cursor < this.Input.Line.length)
                this.Input.Line = this.stringRemoveAtIndex(this.Input.Line, this.Input.Cursor);
        break;
        case 37: //Left
            if(this.Input.Cursor > 0)
                this.Input.Cursor--;
        break;
        case 39: //Right
            if(this.Input.Cursor < this.Input.Line.length)
                this.Input.Cursor++;
        break;
        case 13: //Enter
            this.Output.Lines.reverse();
            this.Output.Lines.pop();
            this.Output.Lines.reverse();
            this.Output.Lines.push(this.Input.Line);
            this.trigger('lineEntered', this.Input.Line);
            this.Input.Line = '';
            this.Input.Cursor = 0;
        break;
    }
};

MassConsole.prototype.keypress = function (event) {
    if(event.keyCode >= 32 && event.keyCode <= 126) {
        this.trigger('charEntered', String.fromCharCode(event.keyCode));
        this.Input.Line = this.stringInsertAtIndex(String.fromCharCode(event.keyCode), this.Input.Line, this.Input.Cursor);
        this.Input.Cursor++;
    }
};

MassConsole.prototype.stringRemoveAtIndex = function (str, index) {
    var start = str.substr(0, index);
    var end = str.substr(index + 1);
    return start + end;
};

MassConsole.prototype.stringInsertAtIndex = function (char, str, index) {
    var start = str.substr(0, index);
    var end = str.substr(index);
    return start + char + end;
};

MassConsole.prototype.colorHexString = function (color) {
    var fullColor = (color.r << 16 | color.g << 8 | color.b).toString(16);
    while(fullColor.length !== 6)
        fullColor = '0' + fullColor;
    return '#' + fullColor.toString(16);
};
