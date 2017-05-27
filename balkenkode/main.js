/**
 * Copyright (c) 2011 - LX networking GbR - http://www.lx-networking.de
 *
 * Permission is hereby granted, free of charge, to any person obtaining 
 * a copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions: 
 * The above copyright notice and this permission notice shall be included 
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
 * THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */ 

$(function() {

    var Balkenkode = Balkenkode || {};

    Balkenkode.Pixmap = Backbone.Model.extend({

        getImageData: function() {
            var imageData = this.get("imageData");
            return imageData;
        },

        getPixel: function(x, y) {
            return [
                this.getRedOfPixel(x, y),
                this.getGreenOfPixel(x, y),
                this.getBlueOfPixel(x, y)
            ];
        },

        getRedOfPixel: function(x, y) {
            return this.getColorOfPixel(x, y, 0);
        },

        getGreenOfPixel: function(x, y) {
            return this.getColorOfPixel(x, y, 1);
        },

        getBlueOfPixel: function(x, y) {
            return this.getColorOfPixel(x, y, 2);
        },

        getColorOfPixel: function(x, y, colorIdx) {
            var imageData = this.get("imageData");
            return imageData.data[(y * imageData.width + x) * 4 + colorIdx];
        },

        getWidth: function() {
            var imageData = this.get("imageData");
            return parseInt(imageData.width);
        },

        getHeight: function() {
            var imageData = this.get("imageData");
            return parseInt(imageData.height);
        }
    });

    Balkenkode.Bitmap = Backbone.Model.extend({

        getBitmapData: function() {
            var bitmapData = this.get("bitmapData");
            return bitmapData;
        },

        getWidth: function() {
            return parseInt(this.get("width"));
        },

        getHeight: function() {
            return parseInt(this.get("height"));
        },

        toString: function() {
            var ret = "";

            var bitmapData = this.getBitmapData();
            var w = this.getWidth();
            var h = this.getHeight();

            for (var y = 0; y < h; y++) {
                for(var x = 0; x < w; x++) {
                    var c = bitmapData[y * w + x] == 0 ? " " : "@";
                    ret += c;
                }
                ret += "\n";
            }

            return ret;
        }

    });

    Balkenkode.RunLengthMap = Backbone.Model.extend({

        getRunLengthData: function() {
            var runLengthData = this.get("runLengthData");
            return runLengthData;
        },

        getGridRowDistance: function() {
            var gridRowDistance = parseInt(this.get("gridRowDistance"))
        },

        getWidth: function() {
            return parseInt(this.get("width"));
        },

        getHeight: function() {
            return parseInt(this.get("height"));
        },

        toString: function(totalWidth) {
            totalWidth = totalWidth == undefined ? 800 : totalWidth;

            var runLengthData = this.getRunLengthData();

            var ret = "";
            for(var y in runLengthData) {
                ret += this.rowToString(runLengthData, y, totalWidth);
                ret += "\n";
            }

            return ret;
        },

        rowToString: function(runLengthData, y, totalWidth) {
            var ret = "";
            var row = runLengthData[y];
            for(var i = 0; i < row.length; i++) {
                var run = row[i];
                var ch = run[0] == 0 ? " " : "@";
                var length = parseInt(Math.round(run[1] * totalWidth));

                ret += this.repeatCharNTimes(ch, length);
            }

            return ret;
        },

        repeatCharNTimes: function(ch, times) {
            var ret = "";
            for(var i = 0; i < times; i++) ret += ch;

            return ret;
        }
    });

    Balkenkode.Barcode = Backbone.Model.extend({

        validate: function(attrs) {

        }

    });

    Balkenkode.EAN13Barcode = Balkenkode.Barcode.extend({

        defaults: {
            numbers: new Array(13)
        },

        validate: function(attrs) {
            var numbers = this.getNumbers();
            for (var i = 0; i < numbers.length; i++) {
                if (numbers[i] < 0 || numbers[i] > 9)
                    return "EAN13 Barcode elements must be digits between 0 and 9";
            }

            /*
            var checkDigit = this.calculateChecksumDigit(numbers);
            if (number[12] != checkDigit)
                return "EAN13 Barcode checkdigit doesn't match, barcode corrupted";
            */
        },

        calculateChecksumDigit : function(numbers) {
            numbers = numbers == undefined ? this.getNumbers() : numbers;

            var checksum = 1 * (numbers[0] + numbers[2] + numbers[4] + numbers[6] + numbers[8] + numbers[10])
                         + 3 * (numbers[1] + numbers[3] + numbers[5] + numbers[7] + numbers[9] + numbers[11]);

            var checkDigit = 10 - (checksum % 10);
            checkDigit = checkDigit == 10 ? 0 : checkDigit;

            return checkDigit;
        },

        getNumbers: function() {
            var numbers = this.get("numbers");
            return numbers;
        },

        toString : function() {
            var numbers = this.getNumbers();
            var ret = "";

            for(var i = 0; i < numbers.length; i++) {
                ret = ret + numbers[i] + "";
            }

            return ret;
        }

    });

    Balkenkode.Filter = Backbone.Model.extend({

        apply: function(imageData) {
            return imageData;
        }

    });

    Balkenkode.GrayscaleFilter = Balkenkode.Filter.extend({

        apply: function(pixmap) {
            this.assertPreconditions(pixmap);

            var canvas = this.get("canvas");
            var w = pixmap.getWidth();
            var h = pixmap.getHeight();

            var ret = canvas.createImageData(w, h);

            for(var x = 0; x < w; x++) {
                for(var y = 0; y < h; y++)
                {
                    var r = pixmap.getRedOfPixel(x, y);
                    var g = pixmap.getGreenOfPixel(x, y);
                    var b = pixmap.getBlueOfPixel(x, y);

                    var grayScaleValue = this.getGrayScaleValue(r, g, b);

                    var pixelIdx = (y * w + x) * 4;
                    ret.data[pixelIdx + 0] = grayScaleValue;
                    ret.data[pixelIdx + 1] = grayScaleValue;
                    ret.data[pixelIdx + 2] = grayScaleValue;
                    ret.data[pixelIdx + 3] = 255;
                }
            }

            return new Balkenkode.Pixmap({ imageData: ret });
        },

        assertPreconditions: function(pixmap) {
            if (pixmap == null) {
                throw new Exception("No pixmap supplied, giving up.")
            }

            var canvas = this.get("canvas");
            if (canvas == null) {
                throw new Exception("No canvas with filter associated, giving up.")
            }
        },

        getGrayScaleValue: function(r, g, b) {
            var grayScaleValue = Math.round(r * 0.30 + g * 0.59 + b * 0.11);
            return grayScaleValue;
        }
    });

    Balkenkode.MonochromeFilter = Balkenkode.Filter.extend({

        apply: function(pixmap) {
            this.assertPreconditions(pixmap);
            
            var canvas = this.get("canvas");
            var w = pixmap.getWidth();
            var h = pixmap.getHeight();

            var origData = pixmap.getImageData();
            var newData = canvas.createImageData(w, h);
            var pivot = this.getPivotValue(origData.data);

            for(var i = 0; i < origData.data.length; i += 4) {

                newData.data[i + 0] = origData.data[i + 0] < pivot ? 0 : 255;
                newData.data[i + 1] = newData.data[i + 0];
                newData.data[i + 2] = newData.data[i + 0];
                newData.data[i + 3] = 255;
            }

            return new Balkenkode.Pixmap({ imageData: newData });
        },

        assertPreconditions: function(pixmap) {
            if (pixmap == null) {
                throw new Exception("No pixmap supplied, giving up.")
            }

            var canvas = this.get("canvas");
            if (canvas == null) {
                throw new Exception("No canvas with filter associated, giving up.")
            }
        },

        getPivotValue: function(data) {
            var sum = 0;

            for(var i = 0; i < data.length; i += 4) {
                sum += data[i];
            }

            return parseInt(Math.round(sum / data.length * 4));
        }
    });

    Balkenkode.BitmapFilter = Balkenkode.Filter.extend({
        
       apply: function(pixmap) {
           this.assertPreconditions(pixmap);

           var origData = pixmap.getImageData();
           var w = pixmap.getWidth();
           var h = pixmap.getHeight();

           var ret = new Array(w * h);

           var j = 0;
           for(var i = 0; i < origData.data.length; i += 4) {
               ret[j++] = origData.data[i] > 1 ? 0 : 1;
           }

           return new Balkenkode.Bitmap({
               width: w,
               height: h,
               bitmapData: ret
           });
       },

       assertPreconditions: function(pixmap) {
           if (pixmap == null) {
                throw new Exception("No pixmap supplied, giving up.")
           }
       }
    });

    Balkenkode.RunLengthFilter = Balkenkode.Filter.extend({

        defaults: {
            "gridRowDistance":    2
        },

        apply: function(bitmap) {
            this.assertPreconditions(bitmap);

            var origData = bitmap.getBitmapData();
            var w  = bitmap.getWidth();
            var h  = bitmap.getHeight();
            var dy = parseInt(this.get("gridRowDistance"))

            var ret = new Array();

            for(var y = 0; y < h; y += dy) {
                ret[y] = this.mapRowToRunLength(origData, w, y);
            }

            return new Balkenkode.RunLengthMap({
                runLengthData: ret,
                gridRowDistance: dy,
                width: w,
                height: h
            });
        },

        mapRowToRunLength: function(origData, w, y) {
            var ret = new Array();

            var n = 0;
            var curVal = null, prevVal = null;
            for(var x = 0; x < w; x++) {
                curVal = origData[y * w + x];

                if (curVal != prevVal && prevVal != null) {
                    ret.push([prevVal, n]);
                    n = 0;
                }

                n++;
                prevVal = curVal;
            }

            if(n > 0) {
                ret.push([prevVal, n]);
            }

            return ret;
        },

        assertPreconditions: function(bitmap) {
            if (bitmap == null) {
                throw new Exception("No bitmap supplied, giving up.")
            }
        }
    });

    Balkenkode.NormalizeRunLengthFilter = Balkenkode.Filter.extend({

        apply: function(runLenghtMap) {
            this.assertPreconditions(runLenghtMap);

            var ret = Array();

            var origData = runLenghtMap.getRunLengthData();
            for(var y in origData) {
                ret[y] = this.normalizeRunLengthRow(origData, y);

            }

            return new Balkenkode.RunLengthMap({
                runLengthData: ret,
                gridRowDistance: runLenghtMap.getGridRowDistance(),
                width: runLenghtMap.getWidth(),
                height: runLenghtMap.getHeight()
            });
        },

        normalizeRunLengthRow: function(origData, y) {
            var row = origData[y];
            var ret = new Array();

            var sum = 0;
            for(var i = 0; i < row.length; i++) {
                sum += row[i][1];
            }

            if (sum == 0) {
                return ret;
            }

            for(var i = 0; i < row.length; i++) {
                ret.push([row[i][0], (row[i][1] * 1.0) / (sum / 1.0)]);
            }

            return ret;
        },

        assertPreconditions: function(runLengthMap) {
            if (runLengthMap == null) {
                throw new Exception("No run length map supplied, giving up.")
            }
        }
    });

    Balkenkode.EAN13PatternMatchFilter = Balkenkode.Filter.extend({

        defaults: {
            sigmaSentinel:      1.0,
            leftDigitsOdd:      [[3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2], [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2]],
            leftDigitsEven:     [[1, 1, 2, 3], [1, 2, 2, 2], [2, 2, 1, 2], [1, 1, 4, 1], [2, 3, 1, 1], [1, 3, 2, 1], [4, 1, 1, 1], [2, 1, 3, 1], [3, 1, 2, 1], [2, 1, 1, 3]],
            rightDigits:        [[3, 2, 1, 1], [2, 2, 2, 1], [2, 1, 2, 2], [1, 4, 1, 1], [1, 1, 3, 2], [1, 2, 3, 1], [1, 1, 1, 4], [1, 3, 1, 2], [1, 2, 1, 3], [3, 1, 1, 2]]
        },

        apply: function(runLenghtMap) {
            this.assertPreconditions(runLenghtMap);

            var ret = Array();

            var origData = runLenghtMap.getRunLengthData();
            for(var y in origData) {
                ret[y] = this.recognizeRow(origData, y);
            }

            return ret;
        },

        recognizeRow: function(origData, y) {
            var row = origData[y];
            var sentinelInfo = this.findStartSentinelInRow(row);

            if (sentinelInfo.idx < 0 || sentinelInfo.idx + 3 > row.length) {
                //console.warn("unable to find start sentinel in row '" + y + "'");
                return;
            }

            var idxInfo = this.getEANBarcodeElementIndicesFromSentinelInfo(sentinelInfo);
            if (idxInfo.endSentinelIdx + 3 > row.length) {
                //console.warn("row '" + y + "' does not contain a whole barcode, "
                //             + "end sentinel with idx+3 '" + idxInfo.leftIdx + "' is after last run '" + row.length + "'");
                return;
            }

            //console.log("found sentinel in row '" + y + "', barcode about to start at '" + sentinelInfo.idx
            //            + "', average one from sentinel is '" + sentinelInfo.avgOne + "'");

            var widthEncodedRow = this.mapRunsToWidthEncodeBarcode(row);
            var rawNumbers = this.mapWidthEncodedValuesToNumbers(widthEncodedRow, idxInfo);

            return rawNumbers;
        },

        findStartSentinelInRow: function(row) {
            for(var i = 0; i < (row.length - 2); i++) {

                var avgOne = this.lookAheadAndTryToFindSentinelAndAvgOne(row, i);
                if (avgOne >= 0) {
                    return {idx: i, avgOne: avgOne};
                }
            }

            return {idx: -1, avgOne: -1};
        },

        lookAheadAndTryToFindSentinelAndAvgOne: function(row, i) {
            var r0 = row[i + 0];
            var r1 = row[i + 1];
            var r2 = row[i + 2];

            if (r0[0] =! 1 || r1[0] != 0 || r2[0] != 1)
                return -1.0;

            var sigma = parseFloat(this.get("sigmaSentinel"));
            var dl1 = Math.abs(r0[1] - r1[1]);
            var dl2 = Math.abs(r0[1] - r2[1]);

            if (dl1 > sigma || dl2 > sigma)
                return -1.0;

            var avgOne = (r0[1] + r1[1] + r2[1]) / 3.0;
            return avgOne;
        },

        getEANBarcodeElementIndicesFromSentinelInfo : function(sentinelInfo) {
            var leftIdx = sentinelInfo.idx + 3;
            var middleGuardIdx = leftIdx + 6 * 4;
            var rightIdx = middleGuardIdx + 5;
            var endSentinelIdx = rightIdx + 6 * 4;

            return {
                leftIdx: leftIdx,
                middleGuardIdx: middleGuardIdx,
                rightIdx: rightIdx,
                endSentinelIdx: endSentinelIdx
            };
        },

        mapRunsToWidthEncodeBarcode: function(normalizedRow) {
            var ret = new Array();

            for(var i = 0; i < normalizedRow.length; i++) {
                var run = normalizedRow[i];
                ret.push(run[1]);
            }

            return ret;
        },

        mapWidthEncodedValuesToNumbers: function(widthEncodedRow, idxInfo) {

            var length = widthEncodedRow.length;
            var numbers = new Array();

            var even = true;
            for(var i = idxInfo.leftIdx; i < idxInfo.middleGuardIdx && i < length; i += 4) {

                //var digitPatterns = even ? this.get("leftDigitsEven") : this.get("leftDigitsOdd");
                var digitPatterns = this.get("leftDigitsEven").concat(this.get("leftDigitsOdd"));
                numbers.push(this.lookAheadAndTryToMatchNumberInPatterns(widthEncodedRow, i, digitPatterns));

                even = !even;
            }

            for(var i = idxInfo.rightIdx; i < idxInfo.endSentinelIdx && i < length; i += 4) {
                var digitPatterns = this.get("rightDigits");
                numbers.push(this.lookAheadAndTryToMatchNumberInPatterns(widthEncodedRow, i, digitPatterns));
            }

            return numbers;
        },

        lookAheadAndTryToMatchNumberInPatterns: function(widthEncodedRow, startIdx, digitPatterns) {
            if (startIdx + 4 >= widthEncodedRow.length) {
                console.warn("look ahead out of bounds, skipping");
                return -1;
            }

            var minError = Number.MAX_VALUE;
            var idxWithMinError = -1;
            for(var i = 0; i < digitPatterns.length; i++) {
                var pattern = digitPatterns[i];

                var err = this.calculatePatternMatchQuality(widthEncodedRow, startIdx, pattern);
                if (err < minError) {
                    idxWithMinError = i;
                    minError = err;
                }
            }

            return idxWithMinError % 10;
        },

        calculatePatternMatchQuality: function(widthEncodedRow, startIdx, pattern) {

            var v1 = widthEncodedRow[startIdx + 0] * 1.0;
            var v2 = widthEncodedRow[startIdx + 1] * 1.0;
            var v3 = widthEncodedRow[startIdx + 2] * 1.0;
            var v4 = widthEncodedRow[startIdx + 3] * 1.0;

            var p1 = pattern[0] * 1.0;
            var p2 = pattern[1] * 1.0;
            var p3 = pattern[2] * 1.0;
            var p4 = pattern[3] * 1.0;

            /*
            var d12 = Math.pow(v1 / v2 - p1 / p2, 2);
            var d13 = Math.pow(v1 / v3 - p1 / p3, 2);
            var d14 = Math.pow(v1 / v4 - p1 / p4, 2);

            var d21 = Math.pow(v2 / v1 - p2 / p1, 2);
            var d23 = Math.pow(v2 / v3 - p2 / p3, 2);
            var d24 = Math.pow(v2 / v4 - p2 / p4, 2);

            var d31 = Math.pow(v3 / v1 - p3 / p1, 2);
            var d32 = Math.pow(v3 / v2 - p3 / p2, 2);
            var d34 = Math.pow(v3 / v4 - p3 / p4, 2);

            return d12 + d13 + d14
                 + d21 + d23 + d24
                 + d31 + d32 + d34;

            */

            var d12 = Math.abs(v1 / v2 - p1 / p2);
            var d13 = Math.abs(v1 / v3 - p1 / p3);
            var d14 = Math.abs(v1 / v4 - p1 / p4);

            var d21 = Math.abs(v2 / v1 - p2 / p1);
            var d23 = Math.abs(v2 / v3 - p2 / p3);
            var d24 = Math.abs(v2 / v4 - p2 / p4);

            var d31 = Math.abs(v3 / v1 - p3 / p1);
            var d32 = Math.abs(v3 / v2 - p3 / p2);
            var d34 = Math.abs(v3 / v4 - p3 / p4);

            return d12 + d13 + d14
                 + d21 + d23 + d24
                 + d31 + d32 + d34;

        },

        assertPreconditions: function(runLengthMap) {
            if (runLengthMap == null) {
                throw new Exception("No run length map supplied, giving up.")
            }
        }

    });

    Balkenkode.EAN13DecisionFilter = Balkenkode.Filter.extend({

        apply: function(numberRows) {
            var histogram = this.calculateNumberHistogramm(numberRows);
            var numbers = this.getMostLikelyNumberFromHistogram(histogram);

            return new Balkenkode.EAN13Barcode({
                numbers: numbers
            });
        },

        calculateNumberHistogramm : function(numberRows) {
            var histogram = new Array();

            for(var y in numberRows) {
                var row = numberRows[y];
                if (row == undefined)
                    continue;

                for(var x = 0; x < row.length; x++) {
                    this.putNumberInHistogram(histogram, x, row[x])
                }
            }

            return histogram;
        },

        putNumberInHistogram : function(histogram, idx, number) {
            if(! histogram[idx])
                histogram[idx] = new Array();

            var histoRow = histogram[idx];
            if (! histoRow[number])
                histoRow[number] = 1;
            else
                histoRow[number] += 1;
        },


        getMostLikelyNumberFromHistogram: function(histogram) {
            var ret = new Array(histogram.length);

            for (var idx = 0; idx < histogram.length; idx++) {
                var histoRow = histogram[idx];
                var maxCount = 0;
                var numberWithMaxCount = -1;

                for(var number in histoRow) {
                    var count = histoRow[number];

                    if (count > maxCount) {
                        maxCount = count;
                        numberWithMaxCount = number;
                    }
                }

                ret[idx] = numberWithMaxCount;
            }

            return ret;
        }
    });

    window.Balkenkode = Balkenkode;
    
});
