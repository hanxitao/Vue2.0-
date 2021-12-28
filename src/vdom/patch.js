export function patch(oldVnode, vnode) {
    const isRealElement = oldVnode.nodeType;

    if (isRealElement) {
        const oldElm = oldVnode;
        const parentElm = oldElm.parentNode;
        let el = createElm(vnode);

        parentElm.insertBefore(el, oldElm.nextSibling);
        parentElm.removeChild(oldVnode);
        return el;
    } else {
        // oldVnode是虚拟DOM
        if (oldVnode.tag !== vnode.tag) {
            // 如果新旧标签不一致，用新的替换旧的。oldVnode.el代表的是真实DOM节点---同级比较
            oldVnode.el.parentNode.replaceChild(createElm(vnode), oldVnode.el);
        }

        // 如果旧节点是一个文本节点
        if (!oldVnode.tag) {
            if (oldVnode.text !== vnode.text) {
                oldVnode.el.textContent = vnode.text;
            }
        }

        // 不符合上面两种，即代表标签一致，并且不是文本节点
        // 为了节点复用，所以直接把旧的虚拟DOM对应的真实DOM赋值给新的虚拟DOM的el属性
        const el = (vnode.el = oldVnode.el);
        updateProperties(vnode, oldVnode.data);
        const oldCh = oldVnode.children || []; // 旧虚拟DOM的儿子
        const newCh = vnode.children || []; // 新虚拟DOM的儿子
        if (oldCh.length > 0 && newCh.length > 0) {
            // 新旧虚拟DOM都存在子节点
            updateChildren(el, oldCh, newCh);
        } else if (oldCh.length) {
            // 旧虚拟DOM有子节点、新虚拟DOM没有子节点
            el.innerHTML = '';
        } else if (newCh.length) {
            // 新虚拟DOM有子节点、旧虚拟DOM没有子节点
            for (let i = 0; i < newCh.length; i ++) {
                const child = newCh[i];
                el.appendChild(createElm(child));
            }
        }
    }
}

function createElm(vnode) {
    let { tag, children, text } = vnode;

    if (typeof tag === 'string') {
        vnode.el = document.createElement(tag);
        updateProperties(vnode);

        children.forEach(child => {
            return vnode.el.appendChild(createElm(child));
        });
    } else {
        vnode.el = document.createTextNode(text);
    }

    return vnode.el;
}

function updateProperties(vnode, oldProps = {}) {
    let newProps = vnode.data || {}; // 新的vnode的属性
    let el = vnode.el; // 真实节点

    // 如果新的节点没有，需要把老的节点属性移除
    for (const k in oldProps) {
        if (!newProps[k]) {
            el.removeAttribute(k);
        }
    }

    // 对style样式做特殊处理，如果新的没有需要把老的style值置为空
    const newStyle = newProps.style || {};
    const oldStyle = oldProps.style || {};
    for (const key in oldStyle) {
        if (!newStyle[key]) {
            el.style[key] = "";
        }
    }

    // 遍历新的属性，进行增加操作
    for (let key in newProps) {
        if (key === 'style') {
            for (let styleName in newProps.style) {
                el.style[styleName] = newProps.style[styleName];
            }
        } else if (key === 'class') {
            el.className = newProps.class;
        } else {
            // 给这个元素添加属性，值就是对应的值
            el.setAttribute(key, newProps[key]);
        }
    }
}

// 判断两个vnode的标签和key是否相同，如果相同则可以认为是同一节点，然后进行复用
function isSameVnode(oldVnode, newVnode) {
    return oldVnode.tag === newVnode.tag && oldVnode.key === newVnode.key;
}

// diff算法核心，采用双指针的方式，对比新旧vnode的子节点
function updateChildren(parent, oldCh, newCh) {
    let oldStartIndex = 0, // 旧虚拟DOM的开始下标
        oldStartVnode = oldCh[0], // 旧虚拟DOM的第一个子节点
        oldEndIndex = oldCh.length - 1, // 旧虚拟DOM的结束下标
        oldEndVnode = oldCh[oldEndIndex]; // 旧虚拟DOM的最后一个子节点
    
    let newStartIndex = 0, // 新虚拟DOM的开始下标
        newStartVnode = newCh[0], // 新虚拟DOM的第一个子节点
        newEndIndex = newCh.length - 1, // 新虚拟DOM的结束下标
        newEndVnode = newCh[newEndIndex]; // 新虚拟DOM的最后一个子节点
    
    // 根据key来创建旧虚拟DOM子节点的index映射表
    function makeIndexByKey(children) {
        let map = {};
        children.forEach((item, index) => {
            map[item.key] = index;
        });
        return map;
    }

    // 生成映射表
    let map = makeIndexByKey(oldCh);

    // 只有当新旧虚拟DOM子节点的双指针起始位置不大于结束位置的时候，才能循环
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
        // 暴力对比过程把移动的vnode置为undefined，如果不存在vnode节点，直接跳过
        if (!oldStartVnode) {
            oldStartVnode = oldCh[++oldStartIndex];
        } else if (!oldEndVnode) {
            oldEndVnode = oldCh[--oldEndIndex];
        } else if (isSameVnode(oldStartVnode, newStartVnode)) {
            // 头和头对比，依次向后追加
            patch(oldStartVnode, newStartVnode); // 递归比较儿子及它们的子节点
            oldStartVnode = oldCh[++oldStartIndex];
            newStartVnode = newCh[++newStartIndex];
        } else if (isSameVnode(oldEndVnode, newEndVnode)) {
            // 尾和尾对比，依次向前追加
            patch(oldEndVnode, newEndVnode);
            oldEndVnode = oldCh[--oldEndIndex];
            newEndVnode = newCh[--newEndIndex];
        } else if (isSameVnode(oldStartVnode, newEndVnode)) {
            // 旧虚拟DOM的头和新的尾相同
            patch(oldStartVnode, newEndVnode);
            parent.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
            oldStartVnode = oldCh[++oldStartIndex];
            newEndVnode = newCh[--newEndIndex];
        } else if (isSameVnode(oldEndVnode, newStartVnode)) {
            // 旧虚拟DOM的尾和新的头相同
            patch(oldEndVnode, newStartVnode);
            parent.insertBefore(oldEndVnode.el, oldStartVnode.el);
            oldEndVnode = oldCh[--oldEndIndex];
            newStartVnode = newCh[++newStartIndex];
        } else {
            // 上述四种情况都不满足，则需要暴力对比
            // 根据旧的虚拟DOM的子节点的key和index的映射表，从新的开始子节点进行查找，如果可以找到久进行移动操作，如果找不到则直接进行插入
            let moveIndex = map[newStartVnode.key];
            if (!moveIndex) {
                // 老的节点找不到则直接插入
                parent.insertBefore(createElm(newStartVnode), oldStartVnode.el);
            } else {
                let moveVnode = oldCh[moveIndex]; // 找得到就拿到老的节点
                oldCh[moveIndex] = undefined; // 用undefined占位
                parent.insertBefore(moveVnode.el, oldStartVnode.el); // 把找到的节点移动到最前面
                patch(moveVnode, newStartVnode);
            }
            newStartVnode = newCh[++newStartIndex];
        }
    }

    // 如果旧的虚拟DOM循环完毕了，但是新节点还有，则新节点需要被添加到头部或者尾部
    if (newStartIndex <= newEndIndex) {
        for (let i = newStartIndex; i <= newEndIndex; i ++) {
            const ele = newCh[newEndIndex + 1] == null ? null : newCh[newEndIndex + 1].el;
            parent.insertBefore(createElm(newCh[i]), ele);
        }
    }

    // 如果新节点循环完毕，老节点还有，证明老的节点需要直接被删除
    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i ++) {
            let child = oldCh[i];
            if (child !== undefined) {
                parent.removeChild(child.el);
            }
        }
    }
}