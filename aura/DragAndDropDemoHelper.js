({
    MAX_FILE_SIZE:4500000,
    //CHUNK_SIZE:950000,
    CHUNK_SIZE:750000,
    showToast : function(title,message) {
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "title": title,
            "message": message
        });
        toastEvent.fire();
    },
    readFile : function(component, helper, file) {
        debugger;
        if(!file)
            return;
        // can check any specific doc only update
        if (file.size>this.MAX_FILE_SIZE)
        {
            this.showToast('Failure!','File exceeding the Max limit '+Math.round(this.MAX_FILE_SIZE/(1024*1024),3)+'Mb, size of the file is '+Math.round(file.size/(1024*1024),3)+'Mb');
            return;
        }
        var spinner = component.find('spinner');
        $A.util.removeClass(spinner,'slds-hide');
        var reader = new FileReader();        
        var self = this;
        reader.onload  = function() {
            var fileContents = reader.result;
            var base64Mark = 'base64,';
            var dataStart = fileContents.indexOf(base64Mark) + base64Mark.length
            fileContents = fileContents.substring(dataStart);
            self.upload(component, file, fileContents);
        };        
        reader.readAsDataURL(file);        
    },    
    upload: function(component, file, fileContents) {         
        var fromPos = 0;
        var toPos = Math.min(fileContents.length, fromPos + this.CHUNK_SIZE);
        console.log('fileName '+file.Name+' fileContents length '+fileContents.length);
        // start with the initial chunk
        this.uploadChunk(component, file, fileContents, fromPos, toPos, '');   
    },
    uploadChunk : function(component, file, fileContents, fromPos, toPos, attachId){        
        var action = component.get('c.saveAttachment');
        
        var chunk = fileContents.substring(fromPos, toPos);
        var self = this;
        action.setParams({           
            parentId:component.get('v.recordId'),
            fileName: file.name,
            base64Data:encodeURIComponent(chunk),
            contentType: file.type,
            fileId: attachId
        });
        action.setCallback(this, function(e){
            if(e.getState()==='SUCCESS')
            {
                if(attachId==='undefined'||attachId===null|| attachId==='')
                attachId = e.getReturnValue();
               	console.log('File Id '+attachId); 
                fromPos = toPos+1;
                toPos = Math.min(fileContents.length, fromPos + self.CHUNK_SIZE);
                if (fromPos < toPos) {
                    console.debug('fromPos '+fromPos+' toPos '+toPos);                     
                    self.uploadChunk(component, file, fileContents, fromPos, toPos, attachId);  
                } else {
                    var spinner = component.find('spinner');                
                    $A.util.addClass(spinner,'slds-hide');                
                    this.showToast('Success!','File uploaded successfully');
                    $A.get('e.force:refreshView').fire();                    
                }
            }
            else if(e.getState()==='ERROR')
            {
                debugger;
                var spinner = component.find('spinner');                
                $A.util.addClass(spinner,'slds-hide');
                var errors = e.getError();
                if (errors) {
                    if (errors[0] && errors[0].message) {
                        console.log("Error message: " + 
                                    errors[0].message);
                        this.showToast('Error message!',errors[0].message);
                    }
                } else {
                    console.log("Unknown error");
                    this.showToast('Error message!','Unknown error');
                }
            }
        });
        component.set('v.picsrc','https://s3-us-west-1.amazonaws.com/sfdc-demo/image-placeholder.png');
        
		$A.enqueueAction(action);
        
    },
    
    fileReadByAjax: function(component, helper,file)
    {
         
        if(!file)
            return;
        // can check any specific doc only update
        /* if (file.size>this.MAX_FILE_SIZE)
        {
            this.showToast('Failure!','File exceeding the Max limit'+this.MAX_FILE_SIZE/(1024*1024)+'Mb');
            return;
        }*/
        var spinner = component.find('spinner');
        $A.util.removeClass(spinner,'slds-hide');
        var reader = new FileReader();        
        var self = this;
        reader.onload  = function() {
            debugger;
            var fileContents = reader.result.substr(reader.result.indexOf(',')+1);            
            self.uploadByAjax(component, file, fileContents);
        };        
        reader.readAsDataURL(file);  
    },
    uploadByAjax: function(component, file, fileContents)
    {
        debugger;
        var attachment = new sforce.SObject('Attachment');
        attachment.Name        = file.name;
        attachment.IsPrivate   = false;
        attachment.ContentType = file.type;
        attachment.Body        = fileContents;
        attachment.Description = file.name;
        attachment.ParentId    = component.get("v.recordId");        
       var results = sforce.connection.create([attachment]);
        for (var i = 0; i < results.length; i++) {
            if (results[i].getBoolean("success")) {
                alert('New Attachment record created:' + results[i].id);
            }
            else {
                alert('Failed:' + results[i]);
                
            }
        }
        var spinner = component.find('spinner');
        $A.util.addClass(spinner,'slds-hide');
    }
})