const youtubedl = require('youtube-dl-exec');
const { getVideoDurationInSeconds } = require('get-video-duration');
const express = require('express');
var ffmpeg = require('fluent-ffmpeg');
var https = require('follow-redirects').https;
var fs = require('fs');
var request = require('request');

const app = express()
const port = process.env.PORT || 1500;

let downloadlink, videourl, artname, name

app.get('/', (req, res) => {

    name = req.query.name.replace(/\s/g, '').toLowerCase()

    if (req.query.art.split(",").length != 0 && req.query.art.split(",").length > 1) {
        artname = req.query.art.split(",")[0].replace(/\s/g, '').toLowerCase()
    } else {
        artname = req.query.art.toLowerCase()
    }

    var options = {
        'method': 'GET',
        'hostname': 'pwisetthon.com',
        'path': '/getmvbg.php?nameandart=' + encodeURIComponent(name) + '' + encodeURIComponent(artname),
        'headers': {
        },
        'maxRedirects': 20
    };

    var reqre = https.request(options, function (resre) {
        var chunks = [];

        resre.on("data", function (chunk) {
            chunks.push(chunk);
        });

        resre.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            if (body != "") {
                console.log(body.toString());
                res.send(body.toString())
            } else {
                const urlpath = encodeURI('/youtube/v3/search?part=snippet&order=viewCount&q=' + name + artname + ' music video&type=video&videoCategoryId=10&key=AIzaSyCKnojj634as24PXtBsL6KUGxEv53C4W4U');
                var options = {
                    'method': 'GET',
                    'hostname': 'youtube.googleapis.com',
                    'path': urlpath,
                    'headers': {
                        'Accept': 'application/json'
                    },
                    'maxRedirects': 20
                };

                var reqyt = https.request(options, function (resyt) {
                    var chunks = [];

                    resyt.on("data", function (chunk) {
                        chunks.push(chunk);
                    });

                    resyt.on("end", function (chunk) {
                        var body = Buffer.concat(chunks);
                        //console.log(body.toString());
                        console.log(JSON.parse(body)["items"][0]["id"]["videoId"])
                        youtubedl('https://www.youtube.com/watch?v=' + JSON.parse(body)["items"][0]["id"]["videoId"], {
                            dumpSingleJson: true,
                            noWarnings: true,
                            noCallHome: true,
                            noCheckCertificate: true,
                            preferFreeFormats: true,
                            youtubeSkipDashManifest: true,
                            referer: 'https://www.youtube.com/watch?v=' + JSON.parse(body)["items"][0]["id"]["videoId"]
                        })
                            .then(output => {
                                downloadlink = output["formats"]
                                //console.log(output)
                                //console.log(downloadlink)
                                downloadlink.forEach(element => {
                                    if (element["format"].search("360p") > 0 && videourl == null) {
                                        videourl = element["url"]
                                        //console.log(element["url"])

                                        /*const file = element["url"];
                                        const filePath = `${__dirname}/files`;

                                        download(file, filePath)
                                            .then(() => {
                                                console.log('Download Completed');
                                            })
                                        download.get(element["url"]);
                                        download.on('done', (dst) => {
                                            // download is finished
                                        });*/
                                    }
                                });

                                const http = require('https'); // or 'https' for https:// URLs
                                //const fs = require('fs');

                                const file = fs.createWriteStream("video.mp4");
                                http.get(videourl, function (response) {
                                    response.pipe(file);

                                    response.on('end', () => {
                                        console.log('test')

                                        //let adamndur

                                        getVideoDurationInSeconds('video.mp4').then((duration) => {
                                            console.log(duration)
                                            ffmpeg('video.mp4')
                                                .setStartTime(new Date((parseInt(duration) - 30) * 1000).toISOString().substr(11, 8))
                                                .setDuration(25)
                                                .output('aftercut.mp4')
                                                .on('end', function (err) {
                                                    if (!err) {
                                                        console.log('successfully converted');

                                                        var options = {
                                                            'method': 'POST',
                                                            'url': 'https://api.gifs.com/media/upload',
                                                            'headers': {
                                                              'Gifs-API-Key': 'gifs617d3e067034d'
                                                            },
                                                            formData: {
                                                              'file': {
                                                                'value': fs.createReadStream('aftercut.mp4'),
                                                                'options': {
                                                                  'filename': 'aftercut.mp4',
                                                                  'contentType': null
                                                                }
                                                              }
                                                            }
                                                        };

                                                        request(options, function (error, response) {
                                                            if (error) throw new Error(error);
                                                            console.log(response.body);

                                                            let gifurl = JSON.parse(response.body)["success"]["files"]["gif"];

                                                            console.log(name + artname)

                                                            var options = {
                                                                'method': 'GET',
                                                                'hostname': 'pwisetthon.com',
                                                                'path': '/setmvbg.php?naa=' + encodeURIComponent(name) + encodeURIComponent(artname) + '&gifurl=' + gifurl,
                                                                'headers': {
                                                                },
                                                                'maxRedirects': 20
                                                            };

                                                            var reqsa = https.request(options, function (ressa) {
                                                                var chunks = [];

                                                                ressa.on("data", function (chunk) {
                                                                    chunks.push(chunk);
                                                                });

                                                                ressa.on("end", function (chunk) {
                                                                    var body = Buffer.concat(chunks);
                                                                    console.log(body.toString());
                                                                    if (body.toString() == "New record created successfully") {
                                                                        res.send(gifurl)
                                                                        fs.stat('video.mp4', function (err, stats) {
                                                                        console.log(stats);//here we got all information of file in stats variable

                                                                        if (err) {
                                                                           return console.error(err);
                                                                        }

                                                                        fs.unlink('video.mp4',function(err){
                                                                           if(err) return console.log(err);
                                                                           console.log('file deleted successfully');
                                                                        });  
                                                                    }
                                                                });

                                                                ressa.on("error", function (error) {
                                                                    console.error(error);
                                                                });
                                                            });

                                                            reqsa.end();
                                                        });

                                                        /*var options = {
                                                            'method': 'POST',
                                                            'hostname': 'api.gifs.com',
                                                            'path': '/media/upload',
                                                            'headers': {
                                                                'Gifs-API-Key': 'gifs617d3e067034d'
                                                            },
                                                            'maxRedirects': 20
                                                        };

                                                        var reqgi = https.request(options, function (resgi) {
                                                            var chunks = [];

                                                            resgi.on("data", function (chunk) {
                                                                chunks.push(chunk);
                                                            });

                                                            resgi.on("end", function (chunk) {
                                                                var body = Buffer.concat(chunks);
                                                                console.log(body.toString());
                                                                console.log(JSON.parse(body)["success"]["files"]["gif"])
                                                                var options = {
                                                                    'method': 'GET',
                                                                    'hostname': 'pwisetthon.com',
                                                                    'path': '/setmvbg.php?naa=' + name + artname + '&gifurl=' + JSON.parse(body)["success"]["files"]["gif"],
                                                                    'headers': {
                                                                    },
                                                                    'maxRedirects': 20
                                                                };

                                                                var reqsa = https.request(options, function (ressa) {
                                                                    var chunks = [];

                                                                    ressa.on("data", function (chunk) {
                                                                        chunks.push(chunk);
                                                                    });

                                                                    ressa.on("end", function (chunk) {
                                                                        var body = Buffer.concat(chunks);
                                                                        console.log(body.toString());
                                                                        if (body.toString() == "New record created successfully") {
                                                                            res.send(JSON.parse(body)["success"]["files"]["gif"])
                                                                        }
                                                                    });

                                                                    ressa.on("error", function (error) {
                                                                        console.error(error);
                                                                    });
                                                                });

                                                                reqsa.end();
                                                            });

                                                            resgi.on("error", function (error) {
                                                                console.error(error);
                                                            });
                                                        });

                                                        var postData = "------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"file\"; filename=\"aftercut.mp4\"\r\nContent-Type: \"{Insert_File_Content_Type}\"\r\n\r\n" + fs.readFileSync('aftercut.mp4') + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--";

                                                        reqgi.setHeader('content-type', 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');

                                                        reqgi.write(postData);

                                                        reqgi.end();*/
                                                    }
                                                })
                                                .on('error', function (err) {
                                                    console.log('conversion error: ', +err);
                                                }).run();

                                        })

                                        //console.log(adamndur)
                                        //console.log(new Date(adamndur * 1000))

                                    });
                                });
                            })
                    });

                    resyt.on("error", function (error) {
                        console.error(error);
                    });
                });

                reqyt.end();
            }
        });

        resre.on("error", function (error) {
            console.error(error);
        });
    });

    reqre.end();

    //pwisetthon.com/getmvbg.php?name=+musicname&art=

    /*if(pwisetthon.search(name+artname) > 0){

    }else{
        var options = {
            'method': 'GET',
            'hostname': 'youtube.googleapis.com',
            'path': '/youtube/v3/search?part=snippet&order=viewCount&q='++'&key=AIzaSyCKnojj634as24PXtBsL6KUGxEv53C4W4U',
            'headers': {
            'Accept': 'application/json'
            },
            'maxRedirects': 20
        };
        
        var req = https.request(options, function (res) {
            var chunks = [];
        
            res.on("data", function (chunk) {
            chunks.push(chunk);
            });
        
            res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
            console.log(body["items"][0]["id"]["videoId"])
            });
        
            res.on("error", function (error) {
            console.error(error);
            });
        });
        
        req.end();

        youtubedl('https://www.youtube.com/watch?v='+youtubeid, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            referer: 'https://www.youtube.com/watch?v='+youtubeid
        })
        .then(output => {
            downloadlink = output["formats"]
            console.log(output)
            //console.log(downloadlink)
            downloadlink.forEach(element => {
                if(element["format"].search("360p") > 0 && videourl == null){
                    videourl = element["url"]
                    //console.log(element["url"])
                    
                    /*const file = element["url"];
                    const filePath = `${__dirname}/files`;
        
                    download(file,filePath)
                    .then(() => {
                        console.log('Download Completed');
                    })
                    /*download.get(element["url"]);
                    download.on('done', (dst) => {
                        // download is finished
                    });*/
    /*}
});

const http = require('https'); // or 'https' for https:// URLs
const fs = require('fs');

const file = fs.createWriteStream("video.mp4");
http.get(videourl, function(response) {
    response.pipe(file);

    response.on('end', () => {
        console.log('test')

        //let adamndur

        getVideoDurationInSeconds('video.mp4').then((duration) => {
            console.log(duration)
            ffmpeg('video.mp4')
            .setStartTime(new Date((parseInt(duration)-30) * 1000).toISOString().substr(11, 8))
            .setDuration(25)
            .output('aftercut.mp4')
            .on('end', function(err) {   
                if(!err){
                    console.log('successfully converted');
                }                 
            })
            .on('error', function(err){
                console.log('conversion error: ', +err);
            }).run();

            var options = {
                'method': 'POST',
                'hostname': 'api.gifs.com',
                'path': '/media/upload',
                'headers': {
                'Gifs-API-Key': 'gifs617d3e067034d'
                },
                'maxRedirects': 20
            };
            
            var req = https.request(options, function (res) {
                var chunks = [];
                
                res.on("data", function (chunk) {
                    chunks.push(chunk);
                });
                
                res.on("end", function (chunk) {
                    var body = Buffer.concat(chunks);
                    console.log(body.toString());
                    console.log(body["success"]["files"]["gif"])
                });
                
                res.on("error", function (error) {
                    console.error(error);
                });
            });
            
            var postData = "------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"file\"; filename=\"/aftercut.mp4\"\r\nContent-Type: \"{Insert_File_Content_Type}\"\r\n\r\n" + fs.readFileSync('/aftercut.mp4') + "\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--";
            
            req.setHeader('content-type', 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW');
            
            req.write(postData);
            
            req.end();
        })

        //console.log(adamndur)
        //console.log(new Date(adamndur * 1000))

    });
});
})
}*/
})

app.listen(port, '0.0.0.0', () => {
    console.log('lottsanook app listening at port: ' + port)
})
