JSZip
=====

A library for creating, reading and editing .zip files with JavaScript, with a
lovely and simple API.

See https://stuk.github.io/jszip for all the documentation.

```javascript
const zip = new JSZip();

zip.file("Hello.txt", "Hello World\n");

const img = zip.folder("images");
img.file("smile.gif", imgData, {base64: true});

zip.generateAsync({type:"blob"}).then(function(content) {
    // see FileSaver.js
    saveAs(content, "example.zip");
});

/*
Results in a zip containing
Hello.txt
images/
    smile.gif
*/
```

JSZip中文例子
-------

>API文档：https://stuk.github.io/jszip
```javascript
/* 创建一个压缩文件 */
const zip = new JSZip();
zip.file("Hello.txt", "Hello World\n"); //添加一个文本到压缩文件
const img = zip.folder("images");//添加一个images文件夹
img.file("smile.gif", imgData, {base64: true});//images文件夹添加图片
zip.generateAsync({type:"blob"}).then(function(content) {
    saveAs(content, "example.zip");//下载压缩包
});
/* 解压文件 */
let data = await (await fetch('example.zip')).arrayBuffer();//下载example.zip
JSZip.loadAsync(data,{'charset':'gbk'}).then(ZIP=>{
//charset:'gbk' 可以使得某些中文压缩包文件名乱码问题得到解决。
    console.log(ZIP.files);
    /*
    for (var file in ZIP.files) {
        ZIP.file(file).async("uint8array").then(data => {
            var blob = new Blob([data], {
              type: "application/binary"
            });
            var url = URL.createObjectURL(blob);
            //document.querySelector('#img').src=url;
        });
    }
    */
});

```

License
-------

JSZip is dual-licensed. You may use it under the MIT license *or* the GPLv3
license. See [LICENSE.markdown](LICENSE.markdown).
