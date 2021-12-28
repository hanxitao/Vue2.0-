const ncname = '[a-zA-Z_][\\-\\.0-9_a-zA-Z]*'; // 匹配标签名，如abc-123
const qnameCapture = `((?:${ncname}\\:)?${ncname})`; // 匹配特殊标签，如abc:234，前面的abc:可有可无
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签，如<abc-123
const startTagClose = /^\s*(\/?)>/; //匹配结束标签 >
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾，如</abc-123>
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性，如id="app"

let root, currentParent; // 代表根节点和当前父节点
// 用栈结构来获取开始和结束标签
let stack = [];
// 标识元素和文本type
const ELEMENT_TYPE = 1;
const TEXT_TYPE = 3;

// 生成ast方法
function createASTElement(tagName, attrs) {
    return {
        tag: tagName,
        type: ELEMENT_TYPE,
        children: [],
        attrs,
        parent: null
    };
}

// 对开始标签进行处理
function handleStartTag({ tagName, attrs }) {
    let element = createASTElement(tagName, attrs);

    if (!root) {
        root = element;
    }
    currentParent = element;
    stack.push(element);
}

// 对结束标签进行处理
function handleEndTag() {
    // 栈结构
    // 比如<div><span></span></div>，当遇到第一个结束标签</span>时，会匹配到栈顶<span>元素对应的ast并取出
    let element = stack.pop();
    // 当前父元素就是栈顶的上一个元素，在这里类似div
    currentParent = stack[stack.length - 1];

    // 建立parent和children的关系
    if (currentParent) {
        element.parent = currentParent;
        currentParent.children.push(element);
    }
}

// 对文本进行处理
function handleChars(text) {
    text = text.replace(/\s/g, '');
    if (text) {
        currentParent.children.push({
            type: TEXT_TYPE,
            text
        })
    }
}

// 解析标签生成ast核心
export function parse(html) {
    console.log(html);
    while(html) {
        // 查找<
        let textEnd = html.indexOf('<');
        // 如果<在第一个，那么证明接下来就是一个标签，不管是开始还是结束标签
        if (textEnd === 0) {
            const startTagMatch = parseStartTag();
            if (startTagMatch) {
                // 把解析好的标签名和属性解析生成ast
                handleStartTag(startTagMatch);
                continue;
            }

            // 匹配结束标签</
            const endTagMatch = html.match(endTag);
            if (endTagMatch) {
                advance(endTagMatch[0].length);
                handleEndTag();
                continue;
            }
        }

        let text;
        // 如hello<div></div>
        if (textEnd >= 0) {
            text = html.substring(0, textEnd);

            if (text) {
                advance(text.length);
                handleChars(text);
            }
        }
    }

    // 匹配开始标签
    function parseStartTag() {
        const start = html.match(startTagOpen);

        if (start) {
            const match = {
                tagName: start[1],
                attrs: []
            };

            // 匹配到了开始标签就截取掉
            advance(start[0].length);

            // 开始匹配属性
            // end代表结束符号>
            // attr表示匹配的属性
            let end, attr;
            while(
                !(end = html.match(startTagClose)) &&
                (attr = html.match(attribute))
            ) {
                advance(attr[0].length);
                attr = {
                    name: attr[1],
                    value: attr[3] || attr[4] || attr[5]//这里是因为正则捕获支持双引号、单引号和无引号的属性值
                };
                match.attrs.push(attr);
            }

            if (end) {
                // 代表一个标签匹配到结束的>了，代表开始标签解析完毕
                advance(1);
                return match;
            }
        }
    }

    function advance(n) {
        html = html.substring(n);
    }

    return root;
}