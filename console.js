var MassConsole = function(rows, columns) {
    this.Rows = rows;
    this.Columns = columns;
    this.FontWidth = 6;
    this.FontHeight = 8;
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

    this.BackBufferCanvas = document.createElement('canvas');
    this.BackBufferCanvas.setAttribute('height', this.Height);
    this.BackBufferCanvas.setAttribute('width', this.Width);
    this.BackBuffer = this.BackBufferCanvas.getContext('2d');
    
    document.addEventListener('keypress', this.keypress.bind(this));
    document.addEventListener('keydown', this.keydown.bind(this));
    window.requestAnimationFrame(this.renderLoop.bind(this));
    this.addEventListener('lineEntered', function(line){console.log('LINE: ' + line);});
}

MassConsole.prototype.drawCharacter = function (character, row, column, color, backColor) {
    if(typeof character !== 'string')
        return;
    if(character.length !== 1)
        return;
    if(row >= this.Rows || row < 0)
        return;
    if(column >= this.Column || column < 0)
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
        ctxChar.font = '8px monospace';
        ctxChar.fillText(character, 1, this.FontHeight - 2);
        this.Characters[charKey] = cChar;
    }

    var charX = column * this.FontWidth;
    var charY = row * this.FontHeight;

    this.BackBuffer.drawImage(this.Characters[charKey], charX, charY);
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
            this.drawCharacter(this.Output.Lines[i][j], i, j);
    }

    this.drawCharacter('>', this.Rows - 1, 0);
    for(var i = 1; i <= this.Input.Line.length; i++)
        this.drawCharacter(this.Input.Line[i-1], this.Rows - 1, i);
    if(((this.Frame / 60) | 0) % 2)
        this.drawCharacter('_', this.Rows -1, this.Input.Cursor + 1);

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
        case 8:
            if(this.Input.Cursor > 0) {
                this.Input.Cursor--;
                this.Input.Line = this.stringRemoveAtIndex(this.Input.Line, this.Input.Cursor);
            }
        break;
        case 46:
            if(this.Input.Cursor < this.Input.Line.length) {
                this.Input.Line = this.stringRemoveAtIndex(this.Input.Line, this.Input.Cursor);
                if(this.Input.Cursor > 0)
                    this.Input.Cursor--;
            }
        break;
        case 37:
            if(this.Input.Cursor > 0)
                this.Input.Cursor--;
        break;
        case 39:
            if(this.Input.Cursor < this.Input.Line.length)
                this.Input.Cursor++;
        break;
        case 13:
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
