!function(){function a(a,d){var e=b.charset,f=document.createElement("link");f.rel="stylesheet",f.href=a,f.charset="function"==typeof e?e(a):e,"onload"in f||"onreadystatechange"in f?f.onload=f.onerror=f.onreadystatechange=function(){(!f.readyState||/loaded|complete/.test(f.readyState))&&(f.onload=f.onerror=f.onreadystatechange=null,d(f))}:d(f),c.insertBefore(f,c.firstChild)}var b=gojs.config(),c=document.head||document.getElementsByTagName("head")[0];gojs.config({loaders:{css:a}})}();