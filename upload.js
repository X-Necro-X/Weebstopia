const express=require('express');
const upload=require('express-fileupload');
const app=express();

app.use(upload());

app.get('/',function(req,res){
    res.sendFile(__dirname+"/index.html");
});

app.post('/',function(req,res){
    if(req.files)
    {
        console.log(req.files);
        var file=req.files.filename;
        var index;
        var filename=file.name;
        for(i=filename.length-1;i>=0;i--)
        if(filename[i]=='.')
        {
            index=i;
            console.log(i);
            break;
        }
        file.name="light"+filename.slice(index);
        file.mv("./upload/"+file.name,function(err){
            if(err)
            res.send("Error");
            else
            res.send("File Uploaded");
        });
    }
});
app.listen(3000, () => {
    console.log("Server started!");
});