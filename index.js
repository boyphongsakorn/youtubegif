const youtubedl = require('youtube-dl-exec');
const { getVideoDurationInSeconds } = require('get-video-duration');
const express = require('express');
var ffmpeg = require('fluent-ffmpeg');
var https = require('follow-redirects').https;
var fs = require('fs');
var request = require('request');

const app = express()
const port = process.env.PORT || 1500;

app.get('/', (req, res) => {
    
    let downloadlink, videourl, artname, name

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
                try {
                    const urlpath = encodeURI('/youtube/v3/search?part=snippet&order=viewCount&q=' + name + artname + ' music video&key=AIzaSyCKnojj634as24PXtBsL6KUGxEv53C4W4U');
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
                            const youtubeid = JSON.parse(body)["items"][0]["id"]["videoId"]
                            //console.log(body.toString());
                            console.log(youtubeid)
                            youtubedl('https://www.youtube.com/watch?v=' + youtubeid, {
                                dumpSingleJson: true,
                                noWarnings: true,
                                noCallHome: true,
                                noCheckCertificate: true,
                                preferFreeFormats: true,
                                youtubeSkipDashManifest: true,
                                referer: 'https://www.youtube.com/watch?v=' + youtubeid
                            })
                                .then(output => {
                                    downloadlink = output["formats"]
                                    downloadlink.forEach(element => {
                                        if (element["format"].search("360p") > 0 && videourl == null) {
                                            videourl = element["url"]
                                        }
                                    });

                                    const http = require('https'); // or 'https' for https:// URLs

                                    const file = fs.createWriteStream("video"+youtubeid+".mp4");
                                    http.get(videourl, function (response) {
                                        response.pipe(file);

                                        response.on('end', () => {
                                            console.log('test')

                                            //let adamndur

                                            getVideoDurationInSeconds('video'+youtubeid+'.mp4').then((duration) => {
                                                console.log(duration)
                                                ffmpeg('video'+youtubeid+'.mp4')
                                                    .setStartTime(new Date((parseInt(duration) - 30) * 1000).toISOString().substr(11, 8))
                                                    .setDuration(25)
                                                    .output('aftercut'+youtubeid+'.mp4')
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
                                                                    'value': fs.createReadStream('aftercut'+youtubeid+'.mp4'),
                                                                    'options': {
                                                                    'filename': 'aftercut'+youtubeid+'.mp4',
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
                                                                        }
                                                                    });

                                                                    ressa.on("error", function (error) {
                                                                        console.error(error);
                                                                    });
                                                                });

                                                                reqsa.end();
                                                            });
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
                } catch (error) {
                    const urlpath = encodeURI('/youtube/v3/search?part=snippet&order=viewCount&q=' + name + ' ' + artname + '&key=AIzaSyCKnojj634as24PXtBsL6KUGxEv53C4W4U');
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
                            const youtubeid = JSON.parse(body)["items"][0]["id"]["videoId"]
                            //console.log(body.toString());
                            console.log(youtubeid)
                            youtubedl('https://www.youtube.com/watch?v=' + youtubeid, {
                                dumpSingleJson: true,
                                noWarnings: true,
                                noCallHome: true,
                                noCheckCertificate: true,
                                preferFreeFormats: true,
                                youtubeSkipDashManifest: true,
                                referer: 'https://www.youtube.com/watch?v=' + youtubeid
                            })
                                .then(output => {
                                    downloadlink = output["formats"]
                                    downloadlink.forEach(element => {
                                        if (element["format"].search("360p") > 0 && videourl == null) {
                                            videourl = element["url"]
                                        }
                                    });

                                    const http = require('https'); // or 'https' for https:// URLs

                                    const file = fs.createWriteStream("video"+youtubeid+".mp4");
                                    http.get(videourl, function (response) {
                                        response.pipe(file);

                                        response.on('end', () => {
                                            console.log('test')

                                            //let adamndur

                                            getVideoDurationInSeconds('video'+youtubeid+'.mp4').then((duration) => {
                                                console.log(duration)
                                                ffmpeg('video'+youtubeid+'.mp4')
                                                    .setStartTime(new Date((parseInt(duration) - 30) * 1000).toISOString().substr(11, 8))
                                                    .setDuration(25)
                                                    .output('aftercut'+youtubeid+'.mp4')
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
                                                                    'value': fs.createReadStream('aftercut'+youtubeid+'.mp4'),
                                                                    'options': {
                                                                    'filename': 'aftercut'+youtubeid+'.mp4',
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
                                                                        }
                                                                    });

                                                                    ressa.on("error", function (error) {
                                                                        console.error(error);
                                                                    });
                                                                });

                                                                reqsa.end();
                                                            });
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
            }
        });

        resre.on("error", function (error) {
            console.error(error);
        });
    });

    reqre.end();
})

app.listen(port, '0.0.0.0', () => {
    console.log('lottsanook app listening at port: ' + port)
})
