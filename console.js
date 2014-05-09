var MassConsole = function(rows, columns) {
    this.Rows = rows;
    this.Columns = columns;
    this.FontWidth = 6;
    this.FontHeight = 8;
    this.Width = this.FontWidth * this.Columns;
    this.Height = this.FontHeight * this.Rows;
    this.Characters = {};
    this.Frame = 0;
    this.counterX = -1;
    this.counterY = -1;
    this.color = {r:255,g:255, b:255};
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

    window.requestAnimationFrame(this.renderLoop.bind(this));
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
        ctxChar.fillText(character, 1, this.FontHeight - 1);
        this.Characters[charKey] = cChar;
    }

    var charX = column * this.FontWidth;
    var charY = row * this.FontHeight;

    this.BackBuffer.drawImage(this.Characters[charKey], charX, charY);
};

MassConsole.prototype.renderLoop = function() {
    for(var i = 0; i < this.Rows * this.Columns; i++) {
    
    if(this.counterX > this.Columns) {
         if(this.counterY  > this.Rows)
            this.counterY = -1;
        this.counterY = this.counterY + 1;
        this.counterX = -1;
    }

    this.color.g++;
    this.color.b++;
    if(this.color.g >= 256) {
        this.color.g = 0;
        this.color.b = 0;
    }

    this.counterX = this.counterX + 1;
    this.drawCharacter(String.fromCharCode(((this.Frame + this.counterX) % 13) + 40), this.counterY, this.counterX, this.color);
    }
    this.Frame++;
    this.Context.drawImage(this.BackBufferCanvas, 0, 0);
    window.requestAnimationFrame(this.renderLoop.bind(this));
};

MassConsole.prototype.colorHexString = function (color) {
    var fullColor = (color.r << 16 | color.g << 8 | color.b).toString(16);
    while(fullColor.length !== 6)
        fullColor = '0' + fullColor;
    return '#' + fullColor.toString(16);
};
