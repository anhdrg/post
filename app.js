gapi.load('auth2', function() {
    gapi.auth2.init({
      client_id: '533723264077-dlnkdkr576nkqqs6a9m4anc04fc4c1e8.apps.googleusercontent.com',
      client_secret: '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',
      scope: 'https://www.googleapis.com/auth/blogger'
    });
});

// Đăng nhập và kiểm tra trạng thái đăng nhập của người dùng
function authenticate() {
    gapi.auth2.getAuthInstance().signIn().then(function() {
      console.log('User signed in.');
    }, function(error) {
      console.error('Error signing in:', error);
    });
}

// Xử lý đăng nhập thành công
function onSignIn(googleUser) {
    console.log('Signed in as ' + googleUser.getBasicProfile().getName());
    console.log('Access token:', googleUser.getAuthResponse().access_token);
}

// Xử lý đăng nhập thất bại
function onSignInFailure(error) {
    console.error('Error signing in:', error);
}
async function postCSV() {
    // Kiểm tra xem đã xác thực chưa
    if (!isAuthenticated()) {
      document.getElementById("status").innerHTML = "Please authenticate first!";
      return;
    }
  
    // Lấy giá trị của các phần tử trên trang
    const blogId = document.getElementById("blog-id").value;
    const csvFile = document.getElementById("csv-file").files[0];
  
    // Kiểm tra xem đã chọn file CSV chưa
    if (!csvFile) {
      document.getElementById("status").innerHTML = "Please choose a CSV file!";
      return;
    }
  
    // Đọc file CSV và chuyển đổi sang danh sách các bài đăng
    const posts = await convertCSVToPosts(csvFile);
  
    try {
      // Tạo đối tượng Blogger service
      const service = google.blogger({
        version: 'v3',
        auth: gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token,
        applicationName: 'Blogger CSV Post'
      });
  
      // Batch insert các bài đăng
      const batch = service.newBatch();
      let count = 1;
      for (const post of posts) {
        const request = service.posts.insert({
          blogId: blogId,
          resource: post
        });
        batch.add(request, {
          id: `post${count}`
        });
        count++;
      }
      const responses = await batch.execute();
  
      // Xử lý kết quả
      let statusHtml = "All posts added successfully!";
      for (const response of Object.values(responses)) {
        if (response.status !== 200) {
          statusHtml = "Failed to add one or more posts!";
          break;
        }
      }
      document.getElementById("status").innerHTML = statusHtml;
    } catch (error) {
      document.getElementById("status").innerHTML = "Failed to add posts: " + error.message;
    }
  }
  function convertCSVToPosts(csvString) {
    const posts = [];
    const csvRows = csvString.trim().split(/\r?\n/);
    const headers = csvRows[0].split(",");
    for (let i = 1; i < csvRows.length; i++) {
      const row = csvRows[i].split(",");
      const title = row[0];
      const content = row[1];
      const gia = row[2];
      const labels = row[3].split(";").map((l) => l.trim());
      labels.unshift("Sản phẩm");
      const imageLinks = row.slice(4, 13).filter((link) => link.trim() !== "");
      let imageHtml = "";
      for (const imageLink of imageLinks) {
        imageHtml += `<img border='0' src='${imageLink}' />`;
      }
      const chitiet = ConvertToHtml(content);
      const xuonghang = "<br/><br/>";
      const noidung = `[giaban]${gia}[/giaban]${xuonghang}[mota][/mota]${xuonghang}[chitiet]${chitiet}[/chitiet] ${imageHtml}`;
      const post = {
        title,
        content: noidung,
        labels,
      };
      posts.push(post);
    }
    return posts;
  }
    