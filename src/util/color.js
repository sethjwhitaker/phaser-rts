export default class Color {
    constructor() {}

    static shadeColor(color, shade) {
        var colorStr = color.toString(16);

        if(colorStr.length < 6) {
            const length = 6-colorStr.length;
            for(var i = 0; i < length; i++) {
                colorStr = "0" + colorStr;
            }
        }

        var newColorStr = "";
        for (var i = 0; i < colorStr.length; i++) {
            const newDigit = parseInt(colorStr[i], 16)-shade;
            newColorStr = newColorStr + Math.min(0xf, Math.max(newDigit, 0)).toString(16);
        }
        
        return parseInt(newColorStr, 16);
    }
}