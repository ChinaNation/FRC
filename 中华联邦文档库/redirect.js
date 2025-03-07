fetch('links.json')
    .then(response => response.json())
    .then(links => {
        const path = window.location.pathname.replace("/", "");
        if (links[path]) {
            window.location.href = links[path]; // 跳转到目标链接
        } else {
            document.body.innerHTML = "<h1>404 Not Found</h1><p>短链接不存在</p>";
        }
    })
    .catch(error => console.error("Error loading links:", error));