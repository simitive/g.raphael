/*
 * g.Raphael 0.51 - Charting library, based on Raphaël
 *
 * Copyright (c) 2009-2012 Dmitry Baranovskiy (http://g.raphaeljs.com)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
 /*
 * piechart method on paper
 */
/*\
 * Paper.piechart
 [ method ]
 **
 * Creates a pie chart
 **
 > Parameters
 **
 - cx (number) x coordinate of the chart
 - cy (number) y coordinate of the chart
 - r (integer) radius of the chart
 - values (array) values used to plot
 - opts (object) options for the chart
 o {
 o minPercent (number) minimal percent threshold which will have a slice rendered. Sliced corresponding to data points below this threshold will be collapsed into 1 additional slice. [default `1`]
 o maxSlices (number) a threshold for how many slices should be rendered before collapsing all remaining slices into 1 additional slice (to focus on most important data points). [default `100`]
 o stroke (string) color of the circle stroke in HTML color format [default `"#FFF"`]
 o strokewidth (integer) width of the chart stroke [default `1`]
 o init (boolean) whether or not to show animation when the chart is ready [default `false`]
 o colors (array) colors be used to plot the chart
 o href (array) urls to to set up clicks on chart slices
 o legend (array) array containing strings that will be used in a legend. Other label options work if legend is defined.
 o legendcolor (string) color of text in legend [default `"#000"`]
 o legendothers (string) text that will be used in legend to describe options that are collapsed into 1 slice, because they are too small to render [default `"Others"`]
 o legendmark (string) symbol used as a bullet point in legend that has the same colour as the chart slice [default `"circle"`]
 o legendpos (string) position of the legend on the chart [default `"east"`]. Other options are `"north"`, `"south"`, `"west"`
 o sort (boolean) whether to sort segments by size (TRUE) or fall back to order the values/legends are supplied (FALSE)
 o }
 **
 = (object) path element of the popup
 > Usage
 | r.piechart(cx, cy, r, values, opts)
 \*/

(function () {

    function Piechart(paper, cx, cy, r, values, opts) {
        opts = opts || {};

        var chartinst = this,
            sectors = [],
            covers = paper.set(),
            chart = paper.set(),
            series = paper.set(),
            order = [],
            len = values.length,
            angle = 0,
            total = 0,
            others = 0,
            cut = opts.maxSlices || 100,
            minPercent = (parseFloat(opts.minPercent) !== undefined) ? parseFloat(opts.minPercent) : 1,
            defcut = Boolean( minPercent ),
            customColor = opts.colors && opts.colors[0] || chartinst.colors[0];

        function sector(cx, cy, r, startAngle, endAngle, fill) {
            // [MF] (12/09/13) Fixed 0,0 co-ordinate bug for doughnut pies with a value of zero.
            if (opts.insideRadius && opts.insideRadius > 0 && (startAngle !== endAngle)) {
                var ir = opts.insideRadius;
                var rad = Math.PI / 180,
                    ox1 = cx + r * Math.cos(-startAngle * rad),
                    ox2 = cx + r * Math.cos(-endAngle * rad),
                    ix1 = cx + ir * Math.cos(-startAngle * rad),
                    ix2 = cx + ir * Math.cos(-endAngle * rad),
                    xm = cx + r / 2 * Math.cos(-(startAngle + (endAngle - startAngle) / 2) * rad),
                    oy1 = cy + r * Math.sin(-startAngle * rad),
                    oy2 = cy + r * Math.sin(-endAngle * rad),
                    iy1 = cy + ir * Math.sin(-startAngle * rad),
                    iy2 = cy + ir * Math.sin(-endAngle * rad),
                    ym = cy + r / 2 * Math.sin(-(startAngle + (endAngle - startAngle) / 2) * rad),
                    res = [
                        "M", ix1, iy1,
                        "A", ir, ir, 0, +(Math.abs(endAngle - startAngle) > 180), 1, ix2, iy2,
                        "L", ox2, oy2,
                        "A", r, r, 0, +(Math.abs(endAngle - startAngle) > 180), 0, ox1, oy1,
                        "z"
                    ];
            } else {
                var rad = Math.PI / 180,
                    x1 = cx + r * Math.cos(-startAngle * rad),
                    x2 = cx + r * Math.cos(-endAngle * rad),
                    xm = cx + r / 2 * Math.cos(-(startAngle + (endAngle - startAngle) / 2) * rad),
                    y1 = cy + r * Math.sin(-startAngle * rad),
                    y2 = cy + r * Math.sin(-endAngle * rad),
                    ym = cy + r / 2 * Math.sin(-(startAngle + (endAngle - startAngle) / 2) * rad),
                    res = [
                        "M", cx, cy,
                        "L", x1, y1,
                        "A", r, r, 0, +(Math.abs(endAngle - startAngle) > 180), 1, x2, y2,
                        "z"
                    ];
            }

            res.middle = { x: xm, y: ym };
            return res;
        }

        chart.covers = covers;

        if (len == 1) {
            if (opts.insideRadius && opts.insideRadius > 0) {
                sw = r - opts.insideRadius;
                series.push(paper.circle(cx, cy, r - sw / 2).attr({ fill: 'transparent', stroke: customColor, "stroke-width": sw }));
            } else {
                series.push(paper.circle(cx, cy, r).attr({ fill: customColor, stroke: opts.stroke || "#fff", "stroke-width": opts.strokewidth == null ? 1 : opts.strokewidth }));
            }
            covers.push(paper.circle(cx, cy, r).attr(chartinst.shim));
            total = values[0];
            values[0] = { value: values[0], order: 0, valueOf: function () { return this.value; } };
            series[0].middle = {x: cx, y: cy};
            series[0].mangle = 180;
        } else {
            for (var i = 0; i < len; i++) {
                total += values[i];
                values[i] = { value: values[i], order: i, valueOf: function () { return this.value; } };
            }

            if (opts.sort == null || opts.sort) {
                values.sort(function (a, b) {
                    return b.value - a.value;
                });
            }

            for (i = 0; i < len; i++) {
                if (defcut && values[i] * 100 / total < minPercent) {
                    cut = i;
                    defcut = false;
                }

                if (i > cut) {
                    defcut = false;
                    values[cut].value += values[i];
                    values[cut].others = true;
                    others = values[cut].value;
                }
            }

            len = Math.min(cut + 1, values.length);
            others && values.splice(len) && (values[cut].others = true);

            for (i = 0; i < len; i++) {
                var mangle = angle - 360 * values[i] / total / 2;

                if (!i) {
                    angle = 90 - mangle;
                    mangle = angle - 360 * values[i] / total / 2;
                }

                if (opts.init) {
                    var ipath = sector(cx, cy, 1, angle, angle - 360 * values[i] / total).join(",");
                }

                var p, path = sector(cx, cy, r, angle, angle -= 360 * values[i] / total);

                if (values[i].value < total) {
                    var strokewidth = 0;
                    if (values[i].value > 0) {
                        strokewidth = (opts.strokewidth == null ? 1 : opts.strokewidth);
                    }
                    p = paper.path(opts.init ? ipath : path).attr({ fill: opts.colors && opts.colors[i] || chartinst.colors[i] || "#666", opacity: opts.opacity && opts.opacity[i], stroke: opts.stroke || "#fff", "stroke-width": strokewidth, "stroke-linejoin": "round" });
                } else {
                    customColor = opts.colors && opts.colors[i] || chartinst.colors[i];
                    p = paper.circle(cx, cy, r).attr({ fill: customColor, opacity: opts.opacity && opts.opacity[i], stroke: opts.stroke || "#fff", "stroke-width": opts.strokewidth == null ? 1 : opts.strokewidth })
                }

                p.value = values[i];
                p.middle = path.middle;
                p.mangle = mangle;
                sectors.push(p);
                series.push(p);
                opts.init && p.animate({ path: path.join(",") }, (+opts.init - 1) || 1000, ">");
            }

            for (i = 0; i < len; i++) {
                p = paper.path(sectors[i].attr("path")).attr(chartinst.shim);
                opts.href && opts.href[i] && p.attr({ href: opts.href[i] });
                p.attr = function () {};
                covers.push(p);
                series.push(p);
            }
        }

        chart.hover = function (fin, fout) {
            fout = fout || function () {};

            var that = this;

            for (var i = 0; i < len; i++) {
                (function (sector, cover, j) {
                    var o = {
                        sector: sector,
                        cover: cover,
                        cx: cx,
                        cy: cy,
                        mx: sector.middle.x,
                        my: sector.middle.y,
                        mangle: sector.mangle,
                        r: r,
                        value: values[j],
                        total: total,
                        label: that.labels && that.labels[j]
                    };
                    cover.mouseover(function () {
                        fin.call(o);
                    }).mouseout(function () {
                        fout.call(o);
                    });
                })(series[i], covers[i], i);
            }
            return this;
        };

        // x: where label could be put
        // y: where label could be put
        // value: value to show
        // total: total number to count %
        chart.each = function (f) {
            var that = this;

            for (var i = 0; i < len; i++) {
                (function (sector, cover, j) {
                    var o = {
                        sector: sector,
                        cover: cover,
                        cx: cx,
                        cy: cy,
                        x: sector.middle.x,
                        y: sector.middle.y,
                        mangle: sector.mangle,
                        r: r,
                        value: values[j],
                        total: total,
                        label: that.labels && that.labels[j]
                    };
                    f.call(o);
                })(series[i], covers[i], i);
            }
            return this;
        };

        chart.click = function (f) {
            var that = this;

            for (var i = 0; i < len; i++) {
                (function (sector, cover, j) {
                    var o = {
                        sector: sector,
                        cover: cover,
                        cx: cx,
                        cy: cy,
                        mx: sector.middle.x,
                        my: sector.middle.y,
                        mangle: sector.mangle,
                        r: r,
                        value: values[j],
                        total: total,
                        label: that.labels && that.labels[j]
                    };
                    cover.click(function () { f.call(o); });
                })(series[i], covers[i], i);
            }
            return this;
        };

        chart.inject = function (element) {
            element.insertBefore(covers[0]);
        };

        var legend = function (labels, otherslabel, mark, dir) {
            var x = cx + r + r / 5,
                y = cy,
                h = y + 10;

            labels = labels || [];
            dir = (dir && dir.toLowerCase && dir.toLowerCase()) || "east";
            mark = paper[mark && mark.toLowerCase()] || "circle";
            chart.labels = paper.set();

            for (var i = 0; i < len; i++) {
                var clr = series[i].attr("fill"),
                    j = values[i].order,
                    txt;

                values[i].others && (labels[j] = otherslabel || "Others");
                labels[j] = chartinst.labelise(labels[j], values[i], total);
                chart.labels.push(paper.set());
                chart.labels[i].push(paper[mark](x + 5, h, 5).attr({ fill: clr, stroke: "none" }));
                chart.labels[i].push(txt = paper.text(x + 20, h, labels[j] || values[j]).attr(chartinst.txtattr).attr({ fill: opts.legendcolor || "#000", "text-anchor": "start"}));
                covers[i].label = chart.labels[i];
                h += txt.getBBox().height * 1.2;
            }

            var bb = chart.labels.getBBox(),
                tr = {
                    east: [0, -bb.height / 2],
                    west: [-bb.width - 2 * r - 20, -bb.height / 2],
                    north: [-r - bb.width / 2, -r - bb.height - 10],
                    south: [-r - bb.width / 2, r + 10]
                }[dir];

            chart.labels.translate.apply(chart.labels, tr);
            chart.push(chart.labels);
        };

        if (opts.legend) {
            legend(opts.legend, opts.legendothers, opts.legendmark, opts.legendpos);
        }

        chart.push(series, covers);
        chart.series = series;
        chart.covers = covers;

        return chart;
    };

    //inheritance
    var F = function() {};
    F.prototype = Raphael.g;
    Piechart.prototype = new F;

    //public
    Raphael.fn.piechart = function(cx, cy, r, values, opts) {
        return new Piechart(this, cx, cy, r, values, opts);
    }

})();
