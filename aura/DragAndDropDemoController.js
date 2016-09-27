({
	onInit : function(component, event, helper) {
		
	},
    onDragOver: function(component, event, helper){
        event.preventDefault();
    },
    onDrop: function(component, event, helper){        
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect='copy';
        var files= event.dataTransfer.files;
        if(files.length>1){            
            helper.showToast('Failure!','You can upload only one file');
            return;
        }           
        helper.readFile(component, helper, files[0]);            
       //helper.fileReadByAjax(component, helper, files[0]);           
    }
})