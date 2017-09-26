function calculate() {
    //查找文档中用于输入输出元素
    var amount = document.getElementById("amount"),
        graph = document.getElementById("graph"),
        apr = document.getElementById("apr"),
        years = document.getElementById("years"),
        zipcode = document.getElementById("zipcode"),
        payment = document.getElementById("payment"),
        total = document.getElementById("total"),
        totalinterest = document.getElementById("totalinterest");

    //假设所有的输入合法的，将从input元素中获取输入数据
    //将百分比格式转化成小数格式，并从年利率转换成为月利率
    //将年度赔付转化成为月度赔付
    var principal = parseFloat(amount.value),
        interest = parseFloat(apr.value) / 100 / 12,
        payments = parseFloat(years.value) * 12;

    //现在计算月度赔付的数据
    var x = Math.pow(1 + interest, payments),
        monthly = (principal * x * interest) / (x - 1);

    //如果结果没有超过JavaScript能表示的数字范围，且用户的输入也正确
    //如果结果合法
    if (isFinite(monthly)) {
        //将数据填充至输出字段的位置
        payment.innerHTML = monthly.toFixed(2);
        total.innerHTML = (monthly * payments).toFixed(2);
        totalinterest.innerHTML = ((monthly * payments) - principal).toFixed(2);

        //将用户的输入数据保存下来，下次访问时也能取到数据
        save(amount.value, apr.value, years.value, zipcode.value);

        //找到并且展示本地放款人，但是忽略网络错误
        try {
            getLenders(amount.value, apr.value, years.value, zipcode.value);
        } catch (e) {
            /*忽略异常处理*/
        }

        //最后，用表展示贷款余额、利息和资产收益
        chart(principal, interest, monthly, payments);
    } else {
        //计算结果不是数字或者是无穷大，意味着输入数据非法或不完整
        //清空之前的输出数据
        payment.innerHTML = ""; //清空元素文本
        total.innerHTML = "";
        totalinterest.innerHTML = "";
        chart(); //不传入参数的话就是清除图标
    }

}


/*
 *  将用户的输入保存到localStorage对象的属性中
 *  这些属性再次访问时还会继续报纸原位置
 *  如果你在浏览器中按照file://URL的方式直接打开本地文件，
 *  则无法再某些浏览器中使用存储功能（比如FireFox）
 *  而通过HTTP打开文件时可行的
 */
function save(amount, apr, years, zipcode) {
    //只有浏览器支持的时候才运行这里的代码
    if (window.localStorage) {
        localStorage.loan_amount = amount;
        localStorage.loan_apr = apr;
        localStorage.loan_years = years;
        localStorage.loan_zipcode = zipcode;
    }
}


//在文档首次加载时，还原输入字段
window.onload = function () {
    //如果浏览器支持本地存储并且上次保存的值存在
    if (window.localStorage && localStorage.loan_amount) {
        document.getElementById("amount").value = localStorage.loan_amount;
        document.getElementById("apr").value = localStorage.loan_apr;
        document.getElementById("years").value = localStorage.loan_years;
        document.getElementById("zipcode").value = localStorage.loan_zipcode;
    }
};

//将用户的输入发送至服务器端脚本将返回一个本地放贷人的链接列表，在这个例子中没有实现这种放贷人的服务
//但如果该服务存在，该函数会使用它
function getLenders(amount, apr, years, zipcode) {
    //如果浏览器不支持XMLHttpRequest对象，则退出
    if (!window.XMLHttpRequest) return;


    //找到要显示放贷人列表的元素
    var ad = document.getElementById("lenders");
    if (!ad) return;


    //将用户的输入数据进行URL编码，并作为查询参数附加在URL里
    var url = "getLenders.php" + //处理数据的URL地址
        "?amt=" + encodeURIComponent(amount) + //成为十六进制的转义序列进行替换
        "&apr=" + encodeURLComponent(apr) +
        "&yrs=" + encodeURLComponent(years) +
        "&zip=" + encodeURLComponent(zipcode);

    //通过XMLHttpRequest对项来提取返回数据
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.send(null);

    //在返回数据之前，注册了一个事件处理，这个处理函数
    //将会在服务器的相应返回值客户端是调用
    //这种异步编程模型在客户端JavaScript中是非常常见的
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            //如果代码运行到这里，说明我们得到了一个合法且完整的HTTP响应
            var response = req.responseText; //HTTP响应式以字符串的形式呈现
            var lenders = JSON.parse(response); //将其解析为JS数组

            //将数组中的放贷人对象装换为HTML字符串形式
            var list = "";
            var lenders_length = lenders.length //提高性能
            for (var i = 0; i < lenders_length; i++) {
                list += '<li><a href="' + lenders[i].url + '">' + lenders[i].name + '</a></li>';
            }
            //渲染放贷人列表
            ad.innerHTML = "<li>" + list + "</li>";
        }
    }
}

//在HTML<canvas>元素中用图标展示月度贷款余额、利息和资产收益
//如果不传入参数的话，则清空之前的图表数据
function chart(principal, interest, monthly, payments) {
    var graph = document.getElementById("graph");
    graph.width = graph.width; //用一种巧妙的手法清除并重置画布
    //如果不传入参数，或者浏览器不支持画布，则直接返回
    if (arguments.length == 0 || !graph.getContext) return;

    //获得画布元素的"context"对象，这个对象定义了一组绘画API
    var g = graph.getContext("2d");
    var width = graph.width,
        height = graph.height;

    //这里的函数作用是将付款数字和美元数据转换成为像素
    function paymentToX(n) {
        return n * width / payments;
    }

    function amountToY(a) {
        return height - (a * height / (monthly * payments * 1.05));
    }

    //付款数据时一条从（0,0）到（payments,monthly*payments）的直线

    g.moveTo(paymentToX(0), amountToY(0)); //从左下方绘制
    g.lineTo(paymentToX(payments), amountToY(monthly * payments)); //绘制到右上方
    g.lineTo(paymentToX(payments), amountToY(0)); //再绘制右下角
    g.closePath(); //将结尾连接至开头
    g.fillStyle = "#f88"; //亮红色
    g.fill(); //填充矩形
    g.font = "bold 12px sans-serif"; //定义字体
    g.fillText("Total Interest Payments", 20, 20); //将文字绘制到图列中

    //很多资产数据并不是线性的，很难将其反应至图表中
    var equity = 0;
    g.beginPath(); //开始绘制新图
    g.moveTo(paymentToX(0), amountToY(0)); //从左下方绘制
    for (var p = 1; p <= payments; p++) {
        //计算出每一笔赔付的利息
        var thisMonthsInterest = (principal - equity) * interest;
        equity += (monthly - thisMonthsInterest) //得到资产额
        g.lineTo(paymentToX(p), amountToY(equity)); //将数据绘制到画布上
    }
    g.lineTo(paymentToX(payments), amountToY(0)); //将数据线绘制至x轴;
    g.closePath(); //将结尾连接至开头
    g.fillStyle = "green"; //用绿色填充
    g.fill(); //曲线之下的部分均填充
    g.fillText("Total Equity", 20, 35); //文本颜色设置为绿色

    //再次循环，余额数据显示为黑色粗线条
    var bal = principal;
    g.beginPath();
    g.moveTo(paymentToX(0), amountToY(0));
    for (var p = 1; p <= payments; p++) {
        var thisMonthsInterest = bal * interest;
        bal -= (monthly - thisMonthsInterest); //得到资产额
        g.lineTo(paymentToX(p), amountToY(bal)); //将直线连接至某点
    }
    g.lineWidth = 3; //将直线宽度加粗
    g.stroke(); //绘制余额的曲线
    g.fillStyle = "black"; //使用黑色字体
    g.fillText("Loan Balance", 20, 50); //图例文字

    //将年度数据在x轴做标记
    g.textAlign = "center"; //文字居中对齐
    var y = amountToY(0); //y坐标为0
    for (var year = 1; year * 12 <= payments; year++) { //遍历每年
        var x = paymentToX(year * 12); //计算标记位置
        g.fillRect(x - 0.5, y - 3, 1, 3); //开始标记位置
        if (year == 1) g.fillText("Year", x, y - 5); //在坐标轴做标记
        if (year % 5 == 0 && year * 12 !== payments) //每5年的数据
            g.fillText(String(year), x, y - 5);
    }

    //将赔付数额标记在右边界
    g.textAlign = "right"; //文字右对齐
    g.textBaseline = "middle"; //文字垂直居中
    var ticks = [monthly * payments, principal]; //我们将要用到的两个点
    var rightEdge = paymentToX(payments); //设置x坐标
    for (var i = 0; i < ticks.length; i++) { //对每两个点做循环
        var y = amountToY(ticks[i]); //计算每个标记的y目标
        g.fillRect(rightEdge - 3, y - 0.5, 3, 1); //绘制标记
        g.fillText(String(ticks[i].toFixed(0)), rightEdge - 5, y) //绘制文本
    }
}
