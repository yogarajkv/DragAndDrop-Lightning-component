public class DragAndDropDemoController {

    @AuraEnabled
    public static String saveAttachment(Id parentId, String fileName, String base64Data,String contentType,String fileId){
        System.debug(fileId+':'+parentId);
        System.debug('Heap size '+Limits.getHeapSize()+'Heap size limits '+Limits.getLimitHeapSize());
        
        try{
            if (fileId==null || fileId=='') {
                fileId = saveTheFile(parentId, fileName, base64Data, contentType);
            } else {
                appendToFile(fileId, base64Data);
            }
        }
        catch(Exception e)
        {
            System.debug('Error '+e.getMessage()+' @ '+e.getLineNumber());   
          //  rollbackAttachment(parentId);
            throw new AuraHandledException(e.getMessage());
        }
        
        return fileId;
    }
    private static void rollbackAttachment(Id parentId)
    {
        System.debug('parentId '+parentId);
        if(parentId!=null||parentId!=''){            
            delete [select id from Attachment where parentId=:parentId];            
        }
    }
      
    private static Id saveTheFile(Id parentId, String fileName, String base64Data, String contentType) { 
        base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');
        System.debug('save theFile');
        System.debug('parentId '+parentId);
      	Transient Attachment a = new Attachment();        
        a.parentId = parentId; 
        a.Body = EncodingUtil.base64Decode(base64Data);
        a.Name = fileName;
        a.IsPrivate = false;        
        a.ContentType = contentType;
        
        insert a;
        System.debug(a);
        Id attachId = a.Id;
        a =null;
        return attachId;
    }
    
    private static void appendToFile(Id fileId, String base64Data) {
        base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');
        System.debug('append to File');
        System.debug('fileId '+fileId);
        System.debug('Heap size '+Limits.getHeapSize()+'Heap size limits '+Limits.getLimitHeapSize());
        
        Transient Attachment a = [
            SELECT Id, Body
            FROM Attachment
            WHERE Id = :fileId
        ];
        System.debug(a);
        
        Transient	String existingBody = EncodingUtil.base64Encode(a.Body);
        System.debug('Existing Body size '+existingBody.length());
        a.Body = EncodingUtil.base64Decode(existingBody + base64Data);  
        
        update a;
        a=null;
    }
}