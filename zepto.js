/* Zepto v1.1.6 - zepto event ajax form ie - zeptojs.com/license */

var Zepto = (function() {
    var undefined, key, $, classList, emptyArray = [], slice = emptyArray.slice, filter = emptyArray.filter,
        document = window.document,
        elementDisplay = {}, classCache = {},
        cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
        //这里正则表达式里面加一个!是用来匹配html注释的：<!--comment-->
        //正则解析：以<开始，接任意\w字符或者!符号，在街上非>字符，再以>结束
        //其实这里就是匹配非自闭合标签的开始部分
        fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    //正则解析：以<开始，中间是标签名字\w，然后任意空格，再一个可选反斜线\，再一个标签结束符</>,标签结束符中间标签名和前面标签名一致
        singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    //正则解析：以<开始，后面不是标签area|br|col|embed|hr|img|input|link|meta|param的任意字符（字母、数字、:、非>），再接闭合标签/>
    //根据后面的代码可以知道，这里是一个容错机制，即Zepto使用者可能会把标签写错，比如把<a></a>写成<a/>,在调用zepto.fragment的时候，自动将错误的转正确
        tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
        //正则解析：匹配body或者html字符串
        rootNodeRE = /^(?:body|html)$/i,
        capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
        methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

        adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
        table = document.createElement('table'),
        tableRow = document.createElement('tr'),
        containers = {
            'tr': document.createElement('tbody'),
            'tbody': table, 'thead': table, 'tfoot': table,
            'td': tableRow, 'th': tableRow,
            '*': document.createElement('div')
        },
    //这3个正则是页面加载的时候，document.readyState状态值 先loading->interactive->complete
    //当document文档正在加载时,返回"loading",当文档结束渲染但在加载内嵌资源时,返回"interactive",当文档加载完成时,返回"complete".
        readyRE = /complete|loaded|interactive/,
    //简单选择器：只包含字母数字下划线和中划线，没有那些[]:等等之类的复杂选择器
        simpleSelectorRE = /^[\w-]*$/,
        class2type = {},
        toString = class2type.toString,
        zepto = {},
        camelize, uniq,
        tempParent = document.createElement('div'),
        propMap = {
            'tabindex': 'tabIndex',
            'readonly': 'readOnly',
            'for': 'htmlFor',
            'class': 'className',
            'maxlength': 'maxLength',
            'cellspacing': 'cellSpacing',
            'cellpadding': 'cellPadding',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'usemap': 'useMap',
            'frameborder': 'frameBorder',
            'contenteditable': 'contentEditable'
        },
        isArray = Array.isArray ||
            function(object){ return object instanceof Array }

    //函数功能：当前元素能被指定的css选择器查找到,则返回true,否则返回false
    zepto.matches = function(element, selector) {
        //如果selector参数没有传入，或者element参数没有传入，或者element不是dom元素，则直接返回false
        if (!selector || !element || element.nodeType !== 1) return false

        //Element.matches(selector)函数：如果当前元素能被指定的css选择器查找到,则返回true,否则返回false.
        //
        var matchesSelector = element.webkitMatchesSelector || element.mozMatchesSelector ||
            element.oMatchesSelector || element.matchesSelector
        //如果浏览器支持以上方法中的一个，则直接调用该方法！
        if (matchesSelector) return matchesSelector.call(element, selector)
        // fall back to performing a selector:
        //如果不支持，则降级处理
        var match, parent = element.parentNode, temp = !parent
        //如果元素没有父节点，则创建一个新的div节点做为该元素的父节点，并将元素element并入该父节点parent
        if (temp) (parent = tempParent).appendChild(element)
        //
        match = ~zepto.qsa(parent, selector).indexOf(element)
        temp && tempParent.removeChild(element)
        return match
    }

    function type(obj) {
        return obj == null ? String(obj) :
        class2type[toString.call(obj)] || "object"
    }

    function isFunction(value) { return type(value) == "function" }
    function isWindow(obj)     { return obj != null && obj == obj.window }
    function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
    function isObject(obj)     { return type(obj) == "object" }
    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
    }
    function likeArray(obj) { return typeof obj.length == 'number' }

    // compact压紧，（使）坚实; 把…弄紧密，把…弄结实; 使（文体）简洁，简化; 变紧密，变结实
    // 该函数去掉数组中为空的元素，如undefined和null
    function compact(array) { return filter.call(array, function(item){ return item != null }) }
    //这里是把二维数组降维成一维数组，也可以把类数组对象转换成标准数组
    //利用的方法是，使用apply第二个参数是数组的特性，把目标array转成函数参数。而函数就是concat
    //有必要说一下concat函数：concat函数参数可以有任意多个；参数可以是数组，也可以是非数组；concat并不改变原数组，会返回一个新的合并之后的数组。另外，字符串也有concat函数，只是性能底下，建议使用+=做字符串拼接
    function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
    //该函数把a-bc-de类型的转换成aBcDe类型
    camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
    function dasherize(str) {
        return str.replace(/::/g, '/')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
            .replace(/([a-z\d])([A-Z])/g, '$1_$2')
            .replace(/_/g, '-')
            .toLowerCase()
    }
    //数组去重，使用了filter方法
    uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

    //函数功能：返回一个css类名的正则表达式
    //首先判断classCache里面有没有name，没有就新建，并且马上缓存起来，然后将之作为结果返回
    //正则解释：字符串开始位置匹配或者匹配空格，然后是名字，然后再匹配空格或者字符串结束位置
    function classRE(name) {
        return name in classCache ?
            classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
    }

    function maybeAddPx(name, value) {
        return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
    }

    function defaultDisplay(nodeName) {
        var element, display
        if (!elementDisplay[nodeName]) {
            element = document.createElement(nodeName)
            document.body.appendChild(element)
            display = getComputedStyle(element, '').getPropertyValue("display")
            element.parentNode.removeChild(element)
            display == "none" && (display = "block")
            elementDisplay[nodeName] = display
        }
        return elementDisplay[nodeName]
    }

    //如果element对象有children属性，则直接返回该属性值，并解构成数组
    //否则对该元素的childNodes属性进行过滤，过滤出nodeType==1的所有子节点
    function children(element) {
        return 'children' in element ?
            slice.call(element.children) :
            $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
    }

    // `$.zepto.fragment` takes a html string and an optional tag name
    // to generate DOM nodes nodes from the given html string.
    // The generated DOM nodes are returned as an array.
    // This function can be overriden in plugins for example to make
    // it compatible with browsers that don't support the DOM fully.
    /*****
     * 这里有必要解释一下3个参数的含义
     * html提供的是html标签及内容
     * name提供该html标签的名字
     * properties提供属性：暂定，后续补充
     ***/
    zepto.fragment = function(html, name, properties) {
        var dom, nodes, container

        // A special case optimization for a single tag
        //如果判断html是单个html标签，则直接通过document.createElement方法创建元素，生成dom
        if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

        //如果上面dom没有生成，即html不是单个html标签，则执行以下代码
        if (!dom) {
            //这里是一个容错机制，把html='<a/>'转成html='<a></a>'
            if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
            //如果没有传入name参数，看html是否匹配非自闭合标签的开始部分，如<a>，并且正则分组1不为空即fragmentRE中的(\w+|!)匹配的部分
            if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
            //如果name不containers对象的属性当中，则name='*'
            if (!(name in containers)) name = '*'

            container = containers[name]
            container.innerHTML = '' + html
            //这里其实是执行了2个操作：
            //1，遍历container的子节点，并一一删除，目的是还原容器container
            //2，$.each会返回一个$container.childNodes的引用，然后赋给dom变量
            dom = $.each(slice.call(container.childNodes), function(){
                container.removeChild(this)
            })
        }

        //不管上面的2个if是否执行，都会检查该项properties
        //如果properties对象直接继承自Object.prototype
        //疑问：这里针对的操作和修改都是在nodes上面，并没有影响到dom对象，这样操作有什么意义呢？
        if (isPlainObject(properties)) {
            //首先使用$函数把dom对象转换成标准的Zepto对象
            nodes = $(dom)
            //再遍历properties属性，
            $.each(properties, function(key, value) {
                //如果key是methodAttributes中一员，则执行nodes的该方法，并且传入参数即是该方法名key对应的value值
                //疑问：这里执行这个函数有什么用呢？要从nodes=$(dom)分析入手
                //methodAttributes的值：['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
                if (methodAttributes.indexOf(key) > -1) nodes[key](value)
                //否则设置nodes的key值为value
                else nodes.attr(key, value)
            })
        }

        //经过以上处理之后，返回dom
        //这里返回的dom对象，要么是标准的Zepto对象（第一个if成立的情况下），要么是dom数组(第二个if成立的情况下)
        return dom
    }

    // `$.zepto.Z` swaps out the prototype of the given `dom` array
    // of nodes with `$.fn` and thus supplying all the Zepto functions
    // to the array. Note that `__proto__` is not supported on Internet
    // Explorer. This method can be overriden in plugins.
    //把dom的原型指向$.fn，从而使dom拥有$.fn上的所有方法。并且给dom对象添加selector属性
    //这里通过zepto.Z(dom, selector)和new zepto.Z(dom, selector)生成的对象d，其d instanceof zepto.Z的值都为false
    zepto.Z = function(dom, selector) {
        dom = dom || []
        dom.__proto__ = $.fn
        dom.selector = selector || ''
        return dom
    }

    // `$.zepto.isZ` should return `true` if the given object is a Zepto
    // collection. This method can be overriden in plugins.
    //疑问：这种object什么情况下才会产生？因为直接通过zepto.Z生产出来的对象都会返回false
    zepto.isZ = function(object) {
        return object instanceof zepto.Z
    }

    // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
    // takes a CSS selector and an optional context (and handles various
    // special cases).
    // This method can be overriden in plugins.
    zepto.init = function(selector, context) {
        var dom
        // If nothing given, return an empty Zepto collection
        if (!selector) return zepto.Z()
        // Optimize for string selectors
        //1.如果selector是字符串：
        else if (typeof selector == 'string') {
            selector = selector.trim()
            // If it's a html fragment, create nodes from it
            // Note: In both Chrome 21 and Firefox 15, DOM error 12
            // is thrown if the fragment doesn't begin with <
            //先判断：如果selector是html元素，即以<开头，并且匹配fragmentRE
            if (selector[0] == '<' && fragmentRE.test(selector))
                dom = zepto.fragment(selector, RegExp.$1, context), selector = null
            // If there's a context, create a collection on that context first, and select
            // nodes from there
            //如果context有的话，则认为selector是选择器，在context下调用选择器查找
            else if (context !== undefined) return $(context).find(selector)
            // If it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector)
        }
        // If a function is given, call it when the DOM is ready
        //2.如果selector是函数，则是一个dom加载完的回调函数
        else if (isFunction(selector)) return $(document).ready(selector)
        // If a Zepto collection is given, just return it
        //3.如果selector本来就是一个Zepto对象，则直接返回该Zepto对象
        else if (zepto.isZ(selector)) return selector
        else {
            // normalize array if an array of nodes is given
            //4.如果selector是一个数组，则先去除selector数组中的undefined和null值
            if (isArray(selector)) dom = compact(selector)
            // Wrap DOM nodes.
            //5.如果selector是一个对象，则将其转成数组
            else if (isObject(selector))
                dom = [selector], selector = null
            // If it's a html fragment, create nodes from it
            //如果selector是一个html标签字符串，则调用zepto.fragment方法生成dom
            else if (fragmentRE.test(selector))
                dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
            // If there's a context, create a collection on that context first, and select
            // nodes from there
            else if (context !== undefined) return $(context).find(selector)
            // And last but no least, if it's a CSS selector, use it to select nodes.
            else dom = zepto.qsa(document, selector)
        }
        // create a new Zepto collection from the nodes found
        //根据dom生成一个zepto.Z对象
        return zepto.Z(dom, selector)
    }

    // `$` will be the base `Zepto` object. When calling this
    // function just call `$.zepto.init, which makes the implementation
    // details of selecting nodes and creating Zepto collections
    // patchable in plugins.
    //调用$()函数的时候，其实返回的是zepto.init()对象
    //而zepto.init()执行的时候，返回的其实是zepto.Z()对象
    //zepto.Z对象返回的其实是标准的dom对象，只是这个dom对象的原型指向了$.fn对象,从而扩展了该dom对象的方法和属性
    $ = function(selector, context){
        return zepto.init(selector, context)
    }

    //对象拷贝函数
    function extend(target, source, deep) {
        for (key in source)
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                extend(target[key], source[key], deep)
            }
            else if (source[key] !== undefined) target[key] = source[key]
    }

    // Copy all but undefined properties from one or more
    // objects to the `target` object.
    $.extend = function(target){
        //把source从arguments里面截取出来
        var deep, args = slice.call(arguments, 1)
        //如果第一个参数target是boolean类型，则认为是一个深浅拷贝，这时候第二个参数被认为是target，第一个参数是deep标记位
        if (typeof target == 'boolean') {
            deep = target
            //这里其实进行了2步操作：
            //1.从args中取出第一个元素作为target
            //2.从args中移除了第一个元素，也即从第三个函数参数开始作为source对象
            target = args.shift()
        }
        //对每一个args对象执行extend属性拷贝动作，后面的source对象属性会覆盖前面source的属性
        args.forEach(function(arg){ extend(target, arg, deep) })
        //返回最终的合并之后的target对象
        return target
    }

    // `$.zepto.qsa` is Zepto's CSS selector implementation which
    // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.从这里可以看出，querySelectorAll的选择效率最低
    // This method can be overriden in plugins.
    zepto.qsa = function(element, selector){
        var found,
            maybeID = selector[0] == '#',
            maybeClass = !maybeID && selector[0] == '.',
        //如果selector是id或者类选择器，则去掉前面的#或者.，否则直接使用selector
            nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
            //是否简单选择器
            isSimple = simpleSelectorRE.test(nameOnly)
        /***
         * 1，如果element是普通的dom元素，并且选择器是简单选择器，并且是ID选择器，则直接调用getElementById去查找元素，找到了，就返回元素数组，否则返回空数组
         * 2，如果1不成立，且element的nodeType不等于1(nodeType==1代表普通dom元素)，且不等于9(nodeType==9代表document元素)，则直接返回空
         * 3，如果1，2不成立，且是简单选择器，并且不是ID选择器，那么判断是否是类选择器，如果是类选择器，则调用element的getElementsByClassName函数去获取，
         * 如果不是id选择器，也不是类选择器，也不是，则认为是tag选择器
         * 如果不是简单选择器，或者不是id选择器，则调用querySelectorAll方法
         * ***/
        return (isDocument(element) && isSimple && maybeID) ?
            ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
            //如果element不是普通元素，也不是document元素，则返回空数组
            (element.nodeType !== 1 && element.nodeType !== 9) ? [] :
                //element是普通dom元素，或者是document元素，将结果拼接成标准数组，并作为函数返回值返回
                slice.call(
                        //是简单选择器，且不是id选择器
                    isSimple && !maybeID ?
                                    //不是类选择器
                        maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
                            //不是类选择器，那只能是tag选择器了
                            element.getElementsByTagName(selector) : // Or a tag
                        //不是简单选择器，或者是id选择器，调用querySelectorAll
                        element.querySelectorAll(selector) // Or it's not simple, and we need to query all
                )
    }

    //没有选择器，则直接返回$(nodes), 否则，从$(nodes)里面过滤
    function filtered(nodes, selector) {
        return selector == null ? $(nodes) : $(nodes).filter(selector)
    }

    //如果浏览器dom对象本身支持contains方法，则使用自带方法
    //否则从node元素开始，一层一层递归往上找node.parentNode对象，直到找到parent===node.parentNode，找到了则返回true，否则返回false
    $.contains = document.documentElement.contains ?
        function(parent, node) {
            return parent !== node && parent.contains(node)
        } :
        function(parent, node) {
            while (node && (node = node.parentNode))
                if (node === parent) return true
            return false
        }

    function funcArg(context, arg, idx, payload) {
        return isFunction(arg) ? arg.call(context, idx, payload) : arg
    }

    function setAttribute(node, name, value) {
        value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
    }

    // access className property while respecting SVGAnimatedString
    function className(node, value){
        var klass = node.className || '',
            svg   = klass && klass.baseVal !== undefined

        //优先取值！！！
        //如果value值为undefined，即value没有传入，则说明取值
        //如果svg为true，即klass.baseVal为真，则返回klass.baseVal，否则，返回klass
        if (value === undefined) return svg ? klass.baseVal : klass

        //如果value不等于undefined，
        //简单说：如果是svg，则设置其baseVal，如果不是，则设置元素的className
        svg ? (klass.baseVal = value) : (node.className = value)
    }

    // "true"  => true
    // "false" => false
    // "null"  => null
    // "42"    => 42
    // "42.5"  => 42.5
    // "08"    => "08"
    // JSON    => parse if valid
    // String  => self
    function deserializeValue(value) {
        try {
            return value ?
            value == "true" ||
            ( value == "false" ? false :
                value == "null" ? null :
                    +value + "" == value ? +value :
                        /^[\[\{]/.test(value) ? $.parseJSON(value) :
                            value )
                : value
        } catch(e) {
            return value
        }
    }

    $.type = type
    $.isFunction = isFunction
    $.isWindow = isWindow
    $.isArray = isArray
    $.isPlainObject = isPlainObject

    //这里会遍历原型对象
    $.isEmptyObject = function(obj) {
        var name
        for (name in obj) return false
        return true
    }

    //参数i是fromIndex，默认值是0
    $.inArray = function(elem, array, i){
        return emptyArray.indexOf.call(array, elem, i)
    }

    $.camelCase = camelize
    $.trim = function(str) {
        return str == null ? "" : String.prototype.trim.call(str)
    }

    // plugin compatibility
    $.uuid = 0
    $.support = { }
    $.expr = { }

    //该map函数和Array.prototype.map函数不一样，这个函数还可以遍历对象，并且返回值中不会出现undefined和null
    //遍历对象的时候，还会遍历该对象的可枚举的原型属性
    $.map = function(elements, callback){
        var value, values = [], i, key
        if (likeArray(elements))
            for (i = 0; i < elements.length; i++) {
                value = callback(elements[i], i)
                if (value != null) values.push(value)
            }
        else
            for (key in elements) {
                value = callback(elements[key], key)
                if (value != null) values.push(value)
            }
        return flatten(values)
    }

    $.each = function(elements, callback){
        var i, key
        //如果elements是类数组对象，则遍历之，以elements[i]为上下文执行callback函数，参数为i和elements[i];如果执行结果===false，则立马返回，返回值就是elements
        if (likeArray(elements)) {
            for (i = 0; i < elements.length; i++)
                if (callback.call(elements[i], i, elements[i]) === false) return elements
        }
        //如果不是类数组，则遍历该对象，执行同样的操作。
        else {
            for (key in elements)
                if (callback.call(elements[key], key, elements[key]) === false) return elements
        }

        return elements
    }

    //此grep函数，就是原生Array.prototype.filter函数调用，从elements中筛选出callback返回值为true的元素
    $.grep = function(elements, callback){
        return filter.call(elements, callback)
    }

    //此parseJSON方法，就是JSON.parse方法的调用
    if (window.JSON) $.parseJSON = JSON.parse

    // Populate the class2type map
    $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
        class2type[ "[object " + name + "]" ] = name.toLowerCase()
    })

    // Define methods that will be available on all
    // Zepto collections
    $.fn = {
        // Because a collection acts like an array
        // copy over these useful array functions.
        forEach: emptyArray.forEach,
        reduce: emptyArray.reduce,
        push: emptyArray.push,
        sort: emptyArray.sort,
        indexOf: emptyArray.indexOf,
        concat: emptyArray.concat,

        // `map` and `slice` in the jQuery API work differently
        // from their array counterparts
        map: function(fn){
            //这里面的this对象，指向调用该map函数的Zepto元素
            //首先对Zepto元素调用map函数，返回值是一个数组，再对该数组转换成标准的Zepto对象
            //所以，这里fn函数最好能返回一个标准的dom元素
            return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
        },
        slice: function(){
            //Array.prototype.slice(startIndex, endIndex)函数，包头不包尾！
            //另外，如果对数组执行slice函数不带任何参数，则会返回一份原数组的拷贝，利用此方法可以浅拷贝一个数组
            return $(slice.apply(this, arguments))
        },

        ready: function(callback){
            // need to check if document.body exists for IE as that browser reports
            // document ready when it hasn't yet created the body element
            //document.readyState说明：当document文档正在加载时,返回"loading",当文档结束渲染但在加载内嵌资源时,返回"interactive",当文档加载完成时,返回"complete".
            //如果文档已经加载完成了，则当执行ready函数的时候，直接执行callback函数
            //如果文档未加载完，则给document的DOMContentLoaded事件绑定事件函数，监听冒泡阶段，不兼容ie
            if (readyRE.test(document.readyState) && document.body) callback($)
            else document.addEventListener('DOMContentLoaded', function(){ callback($) }, false)
            return this
        },
        //如果不传入参数，则以数组的形式全部取回
        get: function(idx){
            return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
        },
        toArray: function(){ return this.get() },
        size: function(){
            return this.length
        },
        remove: function(){
            //这里的this对象指向调用该remove函数的Zepto元素
            //this.each函数返回值就是该this对象，便于链式调用
            return this.each(function(){
                //从父节点中删除子节点！
                //这里注意this的指向这里面的this指向当前遍历出来的el元素
                if (this.parentNode != null)
                    this.parentNode.removeChild(this)
            })
        },
        //以Array.prototype.every函数来遍历，所以，如果callback函数返回false，则遍历会终止
        //callback函数的执行上下文是从Zepto中通过every函数遍历出来的标准dom对象el，传入的参数是idx, el
        //遍历终止之后，返回Zepto对象本身，便于链式调用
        each: function(callback){
            emptyArray.every.call(this, function(el, idx){
                //注意call函数的第一个参数是el，这里已经绑定了callback执行函数的上下文this，就是el元素！后面凡是在each的callback函数中调用的this，都是指向当前遍历的元素el
                return callback.call(el, idx, el) !== false
            })
            return this
        },
        filter: function(selector){
            //这里面的this，都是只想调用该filter方法的Zepto对象
            //如果filter是函数，则
            if (isFunction(selector)) return this.not(this.not(selector))
            //如果selector不是函数，对this进行过滤操作：
            return $(filter.call(this, function(element){
                return zepto.matches(element, selector)
            }))
        },
        add: function(selector,context){
            return $(uniq(this.concat($(selector,context))))
        },
        is: function(selector){
            return this.length > 0 && zepto.matches(this[0], selector)
        },
        not: function(selector){
            var nodes=[]
            //如果参数selector是函数，则遍历该Zepto对象。该函数需有一个参数idx，返回值类型是Boolean类型
            if (isFunction(selector) && selector.call !== undefined)
                this.each(function(idx){
                    //这里面的this是从Zepto对象（即外层this对象）里面遍历出来的普通dom对象
                    //如果以该dom作为上下文调用该函数selector，返回值为假，则将该dom元素存入nodes数组
                    if (!selector.call(this,idx)) nodes.push(this)
                })
            else {
                //如果selector是字符串，
                var excludes = typeof selector == 'string' ? this.filter(selector) :
                    (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
                this.forEach(function(el){
                    if (excludes.indexOf(el) < 0) nodes.push(el)
                })
            }
            return $(nodes)
        },
        has: function(selector){
            return this.filter(function(){
                return isObject(selector) ?
                    $.contains(this, selector) :
                    $(this).find(selector).size()
            })
        },
        eq: function(idx){
            return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
        },
        first: function(){
            var el = this[0]
            return el && !isObject(el) ? el : $(el)
        },
        last: function(){
            var el = this[this.length - 1]
            return el && !isObject(el) ? el : $(el)
        },
        find: function(selector){
            var result, $this = this
            if (!selector) result = $()
            else if (typeof selector == 'object')
                result = $(selector).filter(function(){
                    var node = this
                    return emptyArray.some.call($this, function(parent){
                        return $.contains(parent, node)
                    })
                })
            else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
            else result = this.map(function(){ return zepto.qsa(this, selector) })
            return result
        },
        closest: function(selector, context){
            var node = this[0], collection = false
            if (typeof selector == 'object') collection = $(selector)
            while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
                node = node !== context && !isDocument(node) && node.parentNode
            return $(node)
        },
        parents: function(selector){
            var ancestors = [], nodes = this
            while (nodes.length > 0)
                nodes = $.map(nodes, function(node){
                    if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
                        ancestors.push(node)
                        return node
                    }
                })
            return filtered(ancestors, selector)
        },
        parent: function(selector){
            return filtered(uniq(this.pluck('parentNode')), selector)
        },
        children: function(selector){
            return filtered(this.map(function(){ return children(this) }), selector)
        },
        contents: function() {
            return this.map(function() { return slice.call(this.childNodes) })
        },
        siblings: function(selector){
            return filtered(this.map(function(i, el){
                return filter.call(children(el.parentNode), function(child){ return child!==el })
            }), selector)
        },
        empty: function(){
            return this.each(function(){ this.innerHTML = '' })
        },
        // `pluck` is borrowed from Prototype.js
        pluck: function(property){
            return $.map(this, function(el){ return el[property] })
        },
        show: function(){
            return this.each(function(){
                this.style.display == "none" && (this.style.display = '')
                if (getComputedStyle(this, '').getPropertyValue("display") == "none")
                    this.style.display = defaultDisplay(this.nodeName)
            })
        },
        replaceWith: function(newContent){
            return this.before(newContent).remove()
        },
        wrap: function(structure){
            var func = isFunction(structure)
            if (this[0] && !func)
                var dom   = $(structure).get(0),
                    clone = dom.parentNode || this.length > 1

            return this.each(function(index){
                $(this).wrapAll(
                    func ? structure.call(this, index) :
                        clone ? dom.cloneNode(true) : dom
                )
            })
        },
        wrapAll: function(structure){
            if (this[0]) {
                $(this[0]).before(structure = $(structure))
                var children
                // drill down to the inmost element
                while ((children = structure.children()).length) structure = children.first()
                $(structure).append(this)
            }
            return this
        },
        wrapInner: function(structure){
            var func = isFunction(structure)
            return this.each(function(index){
                var self = $(this), contents = self.contents(),
                    dom  = func ? structure.call(this, index) : structure
                contents.length ? contents.wrapAll(dom) : self.append(dom)
            })
        },
        unwrap: function(){
            this.parent().each(function(){
                $(this).replaceWith($(this).children())
            })
            return this
        },
        clone: function(){
            return this.map(function(){ return this.cloneNode(true) })
        },
        hide: function(){
            return this.css("display", "none")
        },
        toggle: function(setting){
            return this.each(function(){
                var el = $(this)
                    ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
            })
        },
        prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
        next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
        html: function(html){
            return 0 in arguments ?
                this.each(function(idx){
                    var originHtml = this.innerHTML
                    $(this).empty().append( funcArg(this, html, idx, originHtml) )
                }) :
                (0 in this ? this[0].innerHTML : null)
        },
        text: function(text){
            return 0 in arguments ?
                this.each(function(idx){
                    var newText = funcArg(this, text, idx, this.textContent)
                    this.textContent = newText == null ? '' : ''+newText
                }) :
                (0 in this ? this[0].textContent : null)
        },
        attr: function(name, value){
            var result
            return (typeof name == 'string' && !(1 in arguments)) ?
                (!this.length || this[0].nodeType !== 1 ? undefined :
                        (!(result = this[0].getAttribute(name)) && name in this[0]) ? this[0][name] : result
                ) :
                this.each(function(idx){
                    if (this.nodeType !== 1) return
                    if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
                    else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
                })
        },
        removeAttr: function(name){
            return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
                setAttribute(this, attribute)
            }, this)})
        },
        prop: function(name, value){
            name = propMap[name] || name
            return (1 in arguments) ?
                this.each(function(idx){
                    this[name] = funcArg(this, value, idx, this[name])
                }) :
                (this[0] && this[0][name])
        },
        data: function(name, value){
            var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

            var data = (1 in arguments) ?
                this.attr(attrName, value) :
                this.attr(attrName)

            return data !== null ? deserializeValue(data) : undefined
        },
        val: function(value){
            return 0 in arguments ?
                this.each(function(idx){
                    this.value = funcArg(this, value, idx, this.value)
                }) :
                (this[0] && (this[0].multiple ?
                        $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
                        this[0].value)
                )
        },
        offset: function(coordinates){
            if (coordinates) return this.each(function(index){
                var $this = $(this),
                    coords = funcArg(this, coordinates, index, $this.offset()),
                    parentOffset = $this.offsetParent().offset(),
                    props = {
                        top:  coords.top  - parentOffset.top,
                        left: coords.left - parentOffset.left
                    }

                if ($this.css('position') == 'static') props['position'] = 'relative'
                $this.css(props)
            })
            if (!this.length) return null
            var obj = this[0].getBoundingClientRect()
            return {
                left: obj.left + window.pageXOffset,
                top: obj.top + window.pageYOffset,
                width: Math.round(obj.width),
                height: Math.round(obj.height)
            }
        },
        css: function(property, value){
            if (arguments.length < 2) {
                var computedStyle, element = this[0]
                if(!element) return
                computedStyle = getComputedStyle(element, '')
                if (typeof property == 'string')
                    return element.style[camelize(property)] || computedStyle.getPropertyValue(property)
                else if (isArray(property)) {
                    var props = {}
                    $.each(property, function(_, prop){
                        props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
                    })
                    return props
                }
            }

            var css = ''
            if (type(property) == 'string') {
                if (!value && value !== 0)
                    this.each(function(){ this.style.removeProperty(dasherize(property)) })
                else
                    css = dasherize(property) + ":" + maybeAddPx(property, value)
            } else {
                for (key in property)
                    if (!property[key] && property[key] !== 0)
                        this.each(function(){ this.style.removeProperty(dasherize(key)) })
                    else
                        css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
            }

            return this.each(function(){ this.style.cssText += ';' + css })
        },
        index: function(element){
            return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
        },
        //调用Array.prototype.some(callback [, thisArg])函数，
        //Array.prototype.some的第二个可选参数thisArg是第一个参数callback的上下文
        //这里的thisArg参数是classRE(name)
        hasClass: function(name){
            if (!name) return false
            return emptyArray.some.call(this, function(el){
                return this.test(className(el))
            }, classRE(name))
        },
        addClass: function(name){
            if (!name) return this
            return this.each(function(idx){
                if (!('className' in this)) return
                classList = []
                var cls = className(this), newName = funcArg(this, name, idx, cls)
                newName.split(/\s+/g).forEach(function(klass){
                    if (!$(this).hasClass(klass)) classList.push(klass)
                }, this)
                classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
            })
        },
        removeClass: function(name){
            return this.each(function(idx){
                if (!('className' in this)) return
                if (name === undefined) return className(this, '')
                classList = className(this)
                funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
                    classList = classList.replace(classRE(klass), " ")
                })
                className(this, classList.trim())
            })
        },
        toggleClass: function(name, when){
            if (!name) return this
            return this.each(function(idx){
                var $this = $(this), names = funcArg(this, name, idx, className(this))
                names.split(/\s+/g).forEach(function(klass){
                    (when === undefined ? !$this.hasClass(klass) : when) ?
                        $this.addClass(klass) : $this.removeClass(klass)
                })
            })
        },
        scrollTop: function(value){
            if (!this.length) return
            var hasScrollTop = 'scrollTop' in this[0]
            if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
            return this.each(hasScrollTop ?
                function(){ this.scrollTop = value } :
                function(){ this.scrollTo(this.scrollX, value) })
        },
        scrollLeft: function(value){
            if (!this.length) return
            var hasScrollLeft = 'scrollLeft' in this[0]
            if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
            return this.each(hasScrollLeft ?
                function(){ this.scrollLeft = value } :
                function(){ this.scrollTo(value, this.scrollY) })
        },
        position: function() {
            if (!this.length) return

            var elem = this[0],
            // Get *real* offsetParent
                offsetParent = this.offsetParent(),
            // Get correct offsets
                offset       = this.offset(),
                parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

            // Subtract element margins
            // note: when an element has margin: auto the offsetLeft and marginLeft
            // are the same in Safari causing offset.left to incorrectly be 0
            offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
            offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

            // Add offsetParent borders
            parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
            parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

            // Subtract the two offsets
            return {
                top:  offset.top  - parentOffset.top,
                left: offset.left - parentOffset.left
            }
        },
        offsetParent: function() {
            return this.map(function(){
                var parent = this.offsetParent || document.body
                while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
                    parent = parent.offsetParent
                return parent
            })
        }
    }

    // for now
    $.fn.detach = $.fn.remove

        // Generate the `width` and `height` functions
    ;['width', 'height'].forEach(function(dimension){
        var dimensionProperty =
            dimension.replace(/./, function(m){ return m[0].toUpperCase() })

        $.fn[dimension] = function(value){
            var offset, el = this[0]
            if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
                isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
                (offset = this.offset()) && offset[dimension]
            else return this.each(function(idx){
                el = $(this)
                el.css(dimension, funcArg(this, value, idx, el[dimension]()))
            })
        }
    })

    function traverseNode(node, fun) {
        fun(node)
        for (var i = 0, len = node.childNodes.length; i < len; i++)
            traverseNode(node.childNodes[i], fun)
    }

    // Generate the `after`, `prepend`, `before`, `append`,
    // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
    adjacencyOperators.forEach(function(operator, operatorIndex) {
        var inside = operatorIndex % 2 //=> prepend, append

        $.fn[operator] = function(){
            // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
            var argType, nodes = $.map(arguments, function(arg) {
                    argType = type(arg)
                    return argType == "object" || argType == "array" || arg == null ?
                        arg : zepto.fragment(arg)
                }),
                parent, copyByClone = this.length > 1
            if (nodes.length < 1) return this

            return this.each(function(_, target){
                parent = inside ? target : target.parentNode

                // convert all methods to a "before" operation
                target = operatorIndex == 0 ? target.nextSibling :
                    operatorIndex == 1 ? target.firstChild :
                        operatorIndex == 2 ? target :
                            null

                var parentInDocument = $.contains(document.documentElement, parent)

                nodes.forEach(function(node){
                    if (copyByClone) node = node.cloneNode(true)
                    else if (!parent) return $(node).remove()

                    parent.insertBefore(node, target)
                    if (parentInDocument) traverseNode(node, function(el){
                        if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
                            (!el.type || el.type === 'text/javascript') && !el.src)
                            window['eval'].call(window, el.innerHTML)
                    })
                })
            })
        }

        // after    => insertAfter
        // prepend  => prependTo
        // before   => insertBefore
        // append   => appendTo
        $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
            $(html)[operator](this)
            return this
        }
    })

    zepto.Z.prototype = $.fn

    // Export internal API functions in the `$.zepto` namespace
    zepto.uniq = uniq
    zepto.deserializeValue = deserializeValue
    $.zepto = zepto

    return $
})()

window.Zepto = Zepto
window.$ === undefined && (window.$ = Zepto)

;(function($){
    var _zid = 1, undefined,
        slice = Array.prototype.slice,
        isFunction = $.isFunction,
        isString = function(obj){ return typeof obj == 'string' },
        handlers = {},
        specialEvents={},
        focusinSupported = 'onfocusin' in window,
        focus = { focus: 'focusin', blur: 'focusout' },
        hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

    specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

    function zid(element) {
        return element._zid || (element._zid = _zid++)
    }
    function findHandlers(element, event, fn, selector) {
        event = parse(event)
        if (event.ns) var matcher = matcherFor(event.ns)
        return (handlers[zid(element)] || []).filter(function(handler) {
            return handler
                && (!event.e  || handler.e == event.e)
                && (!event.ns || matcher.test(handler.ns))
                && (!fn       || zid(handler.fn) === zid(fn))
                && (!selector || handler.sel == selector)
        })
    }
    function parse(event) {
        var parts = ('' + event).split('.')
        return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
    }
    function matcherFor(ns) {
        return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
    }

    function eventCapture(handler, captureSetting) {
        return handler.del &&
            (!focusinSupported && (handler.e in focus)) ||
            !!captureSetting
    }

    function realEvent(type) {
        return hover[type] || (focusinSupported && focus[type]) || type
    }

    function add(element, events, fn, data, selector, delegator, capture){
        var id = zid(element), set = (handlers[id] || (handlers[id] = []))
        events.split(/\s/).forEach(function(event){
            if (event == 'ready') return $(document).ready(fn)
            var handler   = parse(event)
            handler.fn    = fn
            handler.sel   = selector
            // emulate mouseenter, mouseleave
            if (handler.e in hover) fn = function(e){
                var related = e.relatedTarget
                if (!related || (related !== this && !$.contains(this, related)))
                    return handler.fn.apply(this, arguments)
            }
            handler.del   = delegator
            var callback  = delegator || fn
            handler.proxy = function(e){
                e = compatible(e)
                if (e.isImmediatePropagationStopped()) return
                e.data = data
                var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
                if (result === false) e.preventDefault(), e.stopPropagation()
                return result
            }
            handler.i = set.length
            set.push(handler)
            if ('addEventListener' in element)
                element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
        })
    }
    function remove(element, events, fn, selector, capture){
        var id = zid(element)
            ;(events || '').split(/\s/).forEach(function(event){
            findHandlers(element, event, fn, selector).forEach(function(handler){
                delete handlers[id][handler.i]
                if ('removeEventListener' in element)
                    element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
            })
        })
    }

    $.event = { add: add, remove: remove }

    $.proxy = function(fn, context) {
        var args = (2 in arguments) && slice.call(arguments, 2)
        if (isFunction(fn)) {
            var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
            proxyFn._zid = zid(fn)
            return proxyFn
        } else if (isString(context)) {
            if (args) {
                args.unshift(fn[context], fn)
                return $.proxy.apply(null, args)
            } else {
                return $.proxy(fn[context], fn)
            }
        } else {
            throw new TypeError("expected function")
        }
    }

    $.fn.bind = function(event, data, callback){
        return this.on(event, data, callback)
    }
    $.fn.unbind = function(event, callback){
        return this.off(event, callback)
    }
    $.fn.one = function(event, selector, data, callback){
        return this.on(event, selector, data, callback, 1)
    }

    var returnTrue = function(){return true},
        returnFalse = function(){return false},
        ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$)/,
        eventMethods = {
            preventDefault: 'isDefaultPrevented',
            stopImmediatePropagation: 'isImmediatePropagationStopped',
            stopPropagation: 'isPropagationStopped'
        }

    function compatible(event, source) {
        if (source || !event.isDefaultPrevented) {
            source || (source = event)

            $.each(eventMethods, function(name, predicate) {
                var sourceMethod = source[name]
                event[name] = function(){
                    this[predicate] = returnTrue
                    return sourceMethod && sourceMethod.apply(source, arguments)
                }
                event[predicate] = returnFalse
            })

            if (source.defaultPrevented !== undefined ? source.defaultPrevented :
                    'returnValue' in source ? source.returnValue === false :
                    source.getPreventDefault && source.getPreventDefault())
                event.isDefaultPrevented = returnTrue
        }
        return event
    }

    function createProxy(event) {
        var key, proxy = { originalEvent: event }
        for (key in event)
            if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

        return compatible(proxy, event)
    }

    $.fn.delegate = function(selector, event, callback){
        return this.on(event, selector, callback)
    }
    $.fn.undelegate = function(selector, event, callback){
        return this.off(event, selector, callback)
    }

    $.fn.live = function(event, callback){
        $(document.body).delegate(this.selector, event, callback)
        return this
    }
    $.fn.die = function(event, callback){
        $(document.body).undelegate(this.selector, event, callback)
        return this
    }

    $.fn.on = function(event, selector, data, callback, one){
        var autoRemove, delegator, $this = this
        if (event && !isString(event)) {
            $.each(event, function(type, fn){
                $this.on(type, selector, data, fn, one)
            })
            return $this
        }

        if (!isString(selector) && !isFunction(callback) && callback !== false)
            callback = data, data = selector, selector = undefined
        if (isFunction(data) || data === false)
            callback = data, data = undefined

        if (callback === false) callback = returnFalse

        return $this.each(function(_, element){
            if (one) autoRemove = function(e){
                remove(element, e.type, callback)
                return callback.apply(this, arguments)
            }

            if (selector) delegator = function(e){
                var evt, match = $(e.target).closest(selector, element).get(0)
                if (match && match !== element) {
                    evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
                    return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
                }
            }

            add(element, event, callback, data, selector, delegator || autoRemove)
        })
    }
    $.fn.off = function(event, selector, callback){
        var $this = this
        if (event && !isString(event)) {
            $.each(event, function(type, fn){
                $this.off(type, selector, fn)
            })
            return $this
        }

        if (!isString(selector) && !isFunction(callback) && callback !== false)
            callback = selector, selector = undefined

        if (callback === false) callback = returnFalse

        return $this.each(function(){
            remove(this, event, callback, selector)
        })
    }

    $.fn.trigger = function(event, args){
        event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
        event._args = args
        return this.each(function(){
            // handle focus(), blur() by calling them directly
            if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
            // items in the collection might not be DOM elements
            else if ('dispatchEvent' in this) this.dispatchEvent(event)
            else $(this).triggerHandler(event, args)
        })
    }

    // triggers event handlers on current element just as if an event occurred,
    // doesn't trigger an actual event, doesn't bubble
    $.fn.triggerHandler = function(event, args){
        var e, result
        this.each(function(i, element){
            e = createProxy(isString(event) ? $.Event(event) : event)
            e._args = args
            e.target = element
            $.each(findHandlers(element, event.type || event), function(i, handler){
                result = handler.proxy(e)
                if (e.isImmediatePropagationStopped()) return false
            })
        })
        return result
    }

        // shortcut methods for `.bind(event, fn)` for each event type
    ;('focusin focusout focus blur load resize scroll unload click dblclick '+
    'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
    'change select keydown keypress keyup error').split(' ').forEach(function(event) {
            $.fn[event] = function(callback) {
                return (0 in arguments) ?
                    this.bind(event, callback) :
                    this.trigger(event)
            }
        })

    $.Event = function(type, props) {
        if (!isString(type)) props = type, type = props.type
        var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
        if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
        event.initEvent(type, bubbles, true)
        return compatible(event)
    }

})(Zepto)

;(function($){
    var jsonpID = 0,
        document = window.document,
        key,
        name,
        rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        scriptTypeRE = /^(?:text|application)\/javascript/i,
        xmlTypeRE = /^(?:text|application)\/xml/i,
        jsonType = 'application/json',
        htmlType = 'text/html',
        blankRE = /^\s*$/,
        originAnchor = document.createElement('a')

    originAnchor.href = window.location.href

    // trigger a custom event and return false if it was cancelled
    function triggerAndReturn(context, eventName, data) {
        var event = $.Event(eventName)
        $(context).trigger(event, data)
        return !event.isDefaultPrevented()
    }

    // trigger an Ajax "global" event
    function triggerGlobal(settings, context, eventName, data) {
        if (settings.global) return triggerAndReturn(context || document, eventName, data)
    }

    // Number of active Ajax requests
    $.active = 0

    function ajaxStart(settings) {
        if (settings.global && $.active++ === 0) triggerGlobal(settings, null, 'ajaxStart')
    }
    function ajaxStop(settings) {
        if (settings.global && !(--$.active)) triggerGlobal(settings, null, 'ajaxStop')
    }

    // triggers an extra global event "ajaxBeforeSend" that's like "ajaxSend" but cancelable
    function ajaxBeforeSend(xhr, settings) {
        var context = settings.context
        if (settings.beforeSend.call(context, xhr, settings) === false ||
            triggerGlobal(settings, context, 'ajaxBeforeSend', [xhr, settings]) === false)
            return false

        triggerGlobal(settings, context, 'ajaxSend', [xhr, settings])
    }
    function ajaxSuccess(data, xhr, settings, deferred) {
        var context = settings.context, status = 'success'
        settings.success.call(context, data, status, xhr)
        if (deferred) deferred.resolveWith(context, [data, status, xhr])
        triggerGlobal(settings, context, 'ajaxSuccess', [xhr, settings, data])
        ajaxComplete(status, xhr, settings)
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred) {
        var context = settings.context
        settings.error.call(context, xhr, type, error)
        if (deferred) deferred.rejectWith(context, [xhr, type, error])
        triggerGlobal(settings, context, 'ajaxError', [xhr, settings, error || type])
        ajaxComplete(type, xhr, settings)
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
        var context = settings.context
        settings.complete.call(context, xhr, status)
        triggerGlobal(settings, context, 'ajaxComplete', [xhr, settings])
        ajaxStop(settings)
    }

    // Empty function, used as default callback
    function empty() {}

    $.ajaxJSONP = function(options, deferred){
        if (!('type' in options)) return $.ajax(options)

        var _callbackName = options.jsonpCallback,
            callbackName = ($.isFunction(_callbackName) ?
                    _callbackName() : _callbackName) || ('jsonp' + (++jsonpID)),
            script = document.createElement('script'),
            originalCallback = window[callbackName],
            responseData,
            abort = function(errorType) {
                $(script).triggerHandler('error', errorType || 'abort')
            },
            xhr = { abort: abort }, abortTimeout

        if (deferred) deferred.promise(xhr)

        $(script).on('load error', function(e, errorType){
            clearTimeout(abortTimeout)
            $(script).off().remove()

            if (e.type == 'error' || !responseData) {
                ajaxError(null, errorType || 'error', xhr, options, deferred)
            } else {
                ajaxSuccess(responseData[0], xhr, options, deferred)
            }

            window[callbackName] = originalCallback
            if (responseData && $.isFunction(originalCallback))
                originalCallback(responseData[0])

            originalCallback = responseData = undefined
        })

        if (ajaxBeforeSend(xhr, options) === false) {
            abort('abort')
            return xhr
        }

        window[callbackName] = function(){
            responseData = arguments
        }

        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName)
        document.head.appendChild(script)

        if (options.timeout > 0) abortTimeout = setTimeout(function(){
            abort('timeout')
        }, options.timeout)

        return xhr
    }

    $.ajaxSettings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        beforeSend: empty,
        // Callback that is executed if the request succeeds
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        // Transport
        xhr: function () {
            return new window.XMLHttpRequest()
        },
        // MIME types mapping
        // IIS returns Javascript as "application/x-javascript"
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json:   jsonType,
            xml:    'application/xml, text/xml',
            html:   htmlType,
            text:   'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 0,
        // Whether data should be serialized to string
        processData: true,
        // Whether the browser should be allowed to cache GET responses
        cache: true
    }

    function mimeToDataType(mime) {
        if (mime) mime = mime.split(';', 2)[0]
        return mime && ( mime == htmlType ? 'html' :
                mime == jsonType ? 'json' :
                    scriptTypeRE.test(mime) ? 'script' :
                    xmlTypeRE.test(mime) && 'xml' ) || 'text'
    }

    function appendQuery(url, query) {
        if (query == '') return url
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    // serialize payload and append it to the URL for GET requests
    function serializeData(options) {
        if (options.processData && options.data && $.type(options.data) != "string")
            options.data = $.param(options.data, options.traditional)
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET'))
            options.url = appendQuery(options.url, options.data), options.data = undefined
    }

    $.ajax = function(options){
        var settings = $.extend({}, options || {}),
            deferred = $.Deferred && $.Deferred(),
            urlAnchor
        for (key in $.ajaxSettings) if (settings[key] === undefined) settings[key] = $.ajaxSettings[key]

        ajaxStart(settings)

        if (!settings.crossDomain) {
            urlAnchor = document.createElement('a')
            urlAnchor.href = settings.url
            urlAnchor.href = urlAnchor.href
            settings.crossDomain = (originAnchor.protocol + '//' + originAnchor.host) !== (urlAnchor.protocol + '//' + urlAnchor.host)
        }

        if (!settings.url) settings.url = window.location.toString()
        serializeData(settings)

        var dataType = settings.dataType, hasPlaceholder = /\?.+=\?/.test(settings.url)
        if (hasPlaceholder) dataType = 'jsonp'

        if (settings.cache === false || (
                (!options || options.cache !== true) &&
                ('script' == dataType || 'jsonp' == dataType)
            ))
            settings.url = appendQuery(settings.url, '_=' + Date.now())

        if ('jsonp' == dataType) {
            if (!hasPlaceholder)
                settings.url = appendQuery(settings.url,
                    settings.jsonp ? (settings.jsonp + '=?') : settings.jsonp === false ? '' : 'callback=?')
            return $.ajaxJSONP(settings, deferred)
        }

        var mime = settings.accepts[dataType],
            headers = { },
            setHeader = function(name, value) { headers[name.toLowerCase()] = [name, value] },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            nativeSetHeader = xhr.setRequestHeader,
            abortTimeout

        if (deferred) deferred.promise(xhr)

        if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest')
        setHeader('Accept', mime || '*/*')
        if (mime = settings.mimeType || mime) {
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0]
            xhr.overrideMimeType && xhr.overrideMimeType(mime)
        }
        if (settings.contentType || (settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET'))
            setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded')

        if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name])
        xhr.setRequestHeader = setHeader

        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty
                clearTimeout(abortTimeout)
                var result, error = false
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304 || (xhr.status == 0 && protocol == 'file:')) {
                    dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'))
                    result = xhr.responseText

                    try {
                        // http://perfectionkills.com/global-eval-what-are-the-options/
                        if (dataType == 'script')    (1,eval)(result)
                        else if (dataType == 'xml')  result = xhr.responseXML
                        else if (dataType == 'json') result = blankRE.test(result) ? null : $.parseJSON(result)
                    } catch (e) { error = e }

                    if (error) ajaxError(error, 'parsererror', xhr, settings, deferred)
                    else ajaxSuccess(result, xhr, settings, deferred)
                } else {
                    ajaxError(xhr.statusText || null, xhr.status ? 'error' : 'abort', xhr, settings, deferred)
                }
            }
        }

        if (ajaxBeforeSend(xhr, settings) === false) {
            xhr.abort()
            ajaxError(null, 'abort', xhr, settings, deferred)
            return xhr
        }

        if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name]

        var async = 'async' in settings ? settings.async : true
        xhr.open(settings.type, settings.url, async, settings.username, settings.password)

        for (name in headers) nativeSetHeader.apply(xhr, headers[name])

        if (settings.timeout > 0) abortTimeout = setTimeout(function(){
            xhr.onreadystatechange = empty
            xhr.abort()
            ajaxError(null, 'timeout', xhr, settings, deferred)
        }, settings.timeout)

        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null)
        return xhr
    }

    // handle optional data/success arguments
    function parseArguments(url, data, success, dataType) {
        if ($.isFunction(data)) dataType = success, success = data, data = undefined
        if (!$.isFunction(success)) dataType = success, success = undefined
        return {
            url: url
            , data: data
            , success: success
            , dataType: dataType
        }
    }

    $.get = function(/* url, data, success, dataType */){
        return $.ajax(parseArguments.apply(null, arguments))
    }

    $.post = function(/* url, data, success, dataType */){
        var options = parseArguments.apply(null, arguments)
        options.type = 'POST'
        return $.ajax(options)
    }

    $.getJSON = function(/* url, data, success */){
        var options = parseArguments.apply(null, arguments)
        options.dataType = 'json'
        return $.ajax(options)
    }

    $.fn.load = function(url, data, success){
        if (!this.length) return this
        var self = this, parts = url.split(/\s/), selector,
            options = parseArguments(url, data, success),
            callback = options.success
        if (parts.length > 1) options.url = parts[0], selector = parts[1]
        options.success = function(response){
            self.html(selector ?
                $('<div>').html(response.replace(rscript, "")).find(selector)
                : response)
            callback && callback.apply(self, arguments)
        }
        $.ajax(options)
        return this
    }

    var escape = encodeURIComponent

    function serialize(params, obj, traditional, scope){
        var type, array = $.isArray(obj), hash = $.isPlainObject(obj)
        $.each(obj, function(key, value) {
            type = $.type(value)
            if (scope) key = traditional ? scope :
            scope + '[' + (hash || type == 'object' || type == 'array' ? key : '') + ']'
            // handle data in serializeArray() format
            if (!scope && array) params.add(value.name, value.value)
            // recurse into nested objects
            else if (type == "array" || (!traditional && type == "object"))
                serialize(params, value, traditional, key)
            else params.add(key, value)
        })
    }

    $.param = function(obj, traditional){
        var params = []
        params.add = function(key, value) {
            if ($.isFunction(value)) value = value()
            if (value == null) value = ""
            this.push(escape(key) + '=' + escape(value))
        }
        serialize(params, obj, traditional)
        return params.join('&').replace(/%20/g, '+')
    }
})(Zepto)

;(function($){
    $.fn.serializeArray = function() {
        var name, type, result = [],
            add = function(value) {
                if (value.forEach) return value.forEach(add)
                result.push({ name: name, value: value })
            }
        if (this[0]) $.each(this[0].elements, function(_, field){
            type = field.type, name = field.name
            if (name && field.nodeName.toLowerCase() != 'fieldset' &&
                !field.disabled && type != 'submit' && type != 'reset' && type != 'button' && type != 'file' &&
                ((type != 'radio' && type != 'checkbox') || field.checked))
                add($(field).val())
        })
        return result
    }

    $.fn.serialize = function(){
        var result = []
        this.serializeArray().forEach(function(elm){
            result.push(encodeURIComponent(elm.name) + '=' + encodeURIComponent(elm.value))
        })
        return result.join('&')
    }

    $.fn.submit = function(callback) {
        if (0 in arguments) this.bind('submit', callback)
        else if (this.length) {
            var event = $.Event('submit')
            this.eq(0).trigger(event)
            if (!event.isDefaultPrevented()) this.get(0).submit()
        }
        return this
    }

})(Zepto)

;(function($){
    // __proto__ doesn't exist on IE<11, so redefine
    // the Z function to use object extension instead
    if (!('__proto__' in {})) {
        $.extend($.zepto, {
            Z: function(dom, selector){
                dom = dom || []
                $.extend(dom, $.fn)
                dom.selector = selector || ''
                dom.__Z = true
                return dom
            },
            // this is a kludge but works
            isZ: function(object){
                return $.type(object) === 'array' && '__Z' in object
            }
        })
    }

    // getComputedStyle shouldn't freak out when called
    // without a valid element as argument
    try {
        getComputedStyle(undefined)
    } catch(e) {
        var nativeGetComputedStyle = getComputedStyle;
        window.getComputedStyle = function(element){
            try {
                return nativeGetComputedStyle(element)
            } catch(e) {
                return null
            }
        }
    }
})(Zepto)