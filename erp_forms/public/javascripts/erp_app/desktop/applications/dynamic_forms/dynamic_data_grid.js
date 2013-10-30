Ext.define("Compass.ErpApp.Desktop.Applications.DynamicForms.FileTree",{
  extend: "Compass.ErpApp.Shared.FileManagerTree",
  alias: 'widget.dynamic_forms_DynamicFormsFileTree',  
  loadMask: true,
  autoLoadRoot:false,
  collapsible:false,
  title:'Files',
  rootText:'Files',    
  addViewContentsToContextMenu:false,
  rootVisible:true,
  multiSelect:true,
  containerScroll: true,
  listeners:{
    'load':function(store){
      store.getRootNode().expand();
    },
    'allowdelete':function(){
      return true;
    },
    'allowupload':function(){
      return true;
    },
    'itemclick':function(view, record, item, index, e){
      e.stopEvent();
      return false;
    },
    'fileDeleted':function(fileTreePanel, node){},
    'fileUploaded':function(fileTreePanel, node){}
  },

  changeSecurityOnFile : function(node, secure, fileTree){
      var msg = secure ? 'Securing file...' : 'Unsecuring file...';
      var waitMsg = Ext.Msg.wait("Please Wait", msg);
      Ext.Ajax.request({
        url: '/erp_forms/erp_app/desktop/dynamic_forms/data/update_file_security',
        method: 'POST',
        params:{
          path: node.get('id'),
          secure: secure,
          model_name: fileTree.extraPostData.model_name,
          id: fileTree.extraPostData.id
        },
        success: function(response) {
          var obj = Ext.decode(response.responseText);
          if(obj.success){
            waitMsg.hide();
            if(secure){
              node.set('iconCls', 'icon-document_lock');
            }
            else{
              node.set('iconCls', 'icon-document');
            }
            node.set('isSecured',secure);
            node.commit();
          }
          else{
            Ext.Msg.alert('Error', 'Error securing file.');
          }
        },
        failure: function(response) {
          waitMsg.hide();
          Ext.Msg.alert('Error', 'Error securing file.');
        }
      });
  },

  constructor:function (config) {
    var self = this;

    config = Ext.apply({
      autoDestroy:true,
      title: 'Files',
      itemId: config.itemId,
      region: config.region,
      margins: 0,
      autoScroll: true,
      autoLoadRoot:false,
      showNewFileMenuItem:false,
      showNewFolderMenuItem:false,
      showRenameMenuItem:false,
      enableViewContents:false,
      additionalContextMenuItems:[{
        nodeType:'leaf',
        text:'Update Security',
        iconCls:'icon-document_lock',
        listeners:{
          scope:self,
          'click':function(){
            var node = self.selectedNode;
            self.changeSecurityOnFile(node, !node.get('isSecured'), self);
          }
        }
      }],
      controllerPath:'/erp_forms/erp_app/desktop/dynamic_forms/data',
      standardUploadUrl:'/erp_forms/erp_app/desktop/dynamic_forms/data/upload_file',
      url:'/erp_forms/erp_app/desktop/dynamic_forms/data/get_files'
    }, config);

    this.callParent([config]);
  }
});

Ext.define("Compass.ErpApp.Desktop.Applications.DynamicForms.DynamicDataGridPanel",{
    extend:"Compass.ErpApp.Shared.DynamicEditableGridLoaderPanel",
    alias:'widget.dynamic_forms_DynamicDataGridPanel',

    addCommentWindow : function(record_id, model_name, comment_div_id){
        var commentForm = {
            url: '/erp_forms/erp_app/desktop/dynamic_forms/comments/add',
            xtype: 'form',
            items: [{
                xtype: 'textarea',
                name: 'comment',
                width: 800,
                height: 400
            }],
            buttons:[{
                text:'Submit',
                listeners:{
                  'click':function(button){
                    var formPanel = button.findParentByType('form');
                    formPanel.getForm().submit({
                      params:{
                        id:record_id,
                        model_name:model_name
                      },
                      reset:false,
                      success:function(form, action){
                        var obj =  Ext.decode(action.response.responseText);
                        if(obj.success){
                            var randomnumber = Math.floor(Math.random()*1024);
                            var target_div = 'new-comment-'+randomnumber;
                            string = '<div id="'+target_div+'" class="comment">';
                            string += '<i>by you, just now</i><br />';
                            string += formPanel.getForm().findField('comment').getValue();
                            string += '</div>';
                            document.getElementById(comment_div_id).innerHTML += string;
                            button.findParentByType('window').close();
                            codemirrorHighlight(target_div);
                            Ext.getCmp('commentsPanel'+model_name+record_id).doLayout();
                        }
                        else{
                          Ext.Msg.alert("Error", obj.msg);
                        }
                      },
                      failure:function(form, action){
                        var obj =  Ext.decode(action.response.responseText);
                        if(Compass.ErpApp.Utility.isBlank(obj.message)){
                          Ext.Msg.alert("Error", 'Error adding comment.');
                        }
                        else{
                          Ext.Msg.alert("Error", obj.message);
                        }
                      }
                    });
                  }
                }
            }]
        };

        var commentWindow = Ext.create('Ext.window.Window',{
            id: 'commentWindow_'+model_name+record_id,
            title: 'Add Comment',
            items: [commentForm],
            autoDestroy:true
        });

        commentWindow.show();        
    },

    viewRecord : function(rec, formPanel){
        var self = this;
        var gridpanel_id = self.id;
        var record_id = (Ext.isEmpty(rec.model_name) ? rec.get("id") : rec.id);
        var model_name = (Ext.isEmpty(rec.model_name) ? rec.get("model_name") : rec.model_name);

        // check and see if tab already open
        var center_region = self.findParentByType('dynamic_forms_centerregion');
        var tab = center_region.workArea.query('#'+model_name+'-'+record_id).first();
        if (tab){
            center_region.workArea.setActiveTab(center_region.workArea.items.length - 1);
            return;    
        }

        Ext.getCmp('dynamic_forms_westregion').setWindowStatus('Getting data ...');
        Ext.Ajax.request({
            url: '/erp_forms/erp_app/desktop/dynamic_forms/data/get',
            method: 'POST',
            params:{
                id:record_id,
                model_name:model_name
            },
            success: function(response) {
                Ext.getCmp('dynamic_forms_westregion').clearWindowStatus();
                var response_text = Ext.decode(response.responseText);
                var center_region = self.findParentByType('dynamic_forms_centerregion');
                var ticket_div_id = gridpanel_id+'_ticket';

                var leftPanelItems = [formPanel];

                //comments
                if (response_text.comments){
                    var comment_div_id = gridpanel_id+'_comments';
                    comments_string = '<div id="'+comment_div_id+'" class="comments">';
                    Ext.each(response_text.comments, function(comment){
                        comments_string += '<div class="comment">';
                        comments_string += '<i>by '+comment.commentor_name+ ', '+comment.created_at+'</i><br />';
                        comments_string += comment.comment;
                        comments_string += '</div>';
                    });
                    comments_string += '</div>';

                    var commentsPanel = {
                        id: 'commentsPanel'+model_name+record_id,
                        xtype: 'panel',
                        title: 'Comments',
                        html: comments_string,
                        tbar: [{ 
                            xtype: 'button', 
                            text: 'Add Comment',
                            iconCls: 'icon-add',
                            listeners:{
                              click: function(button){
                                Ext.getCmp(gridpanel_id).addCommentWindow(record_id, model_name, comment_div_id);
                              }
                            }
                        }]
                    };
                    leftPanelItems.push(commentsPanel);
                }

                var leftPanel = {
                    xtype: 'panel',
                    autoScroll: true,
                    items: leftPanelItems,
                    region: 'center'
                };

                var metaDataPanel = {
                    xtype: 'form',
                    title: 'MetaData',
                    bodyPadding: 10,
                    items:[
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Created By',
                            value: response_text.metadata.created_username
                        },
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Created At',
                            value: response_text.metadata.created_at
                        },
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Updated By',
                            value: response_text.metadata.updated_username
                        },
                        {
                            xtype: 'displayfield',
                            fieldLabel: 'Updated At',
                            value: response_text.metadata.updated_at
                        }
                    ]
                };

                var rightPanelItems = [metaDataPanel];

                if (response_text.has_file_assets){
                    var fileTree = Ext.create('Compass.ErpApp.Desktop.Applications.DynamicForms.FileTree', {
                      width: 250,
                      minHeight: 800,
                      allowDownload:false,
                      listeners:{
                        'beforeload':function(store){
                            store.getProxy().extraParams.id = record_id;
                            store.getProxy().extraParams.model_name = model_name;
                        },
                        'load':function(store){
                            store.getRootNode().expand();
                        },
                        'afterrender':function(panel){
                            setTimeout(function(){ 
                                panel.getStore().load();
                            },100);
                        },
                        'downloadfile':function(fileTreePanel, node){
                          window.open("/download/"+node.data.text+"?path=" + node.data.downloadPath,'mywindow','width=400,height=200');
                          return false;
                        }
                      }
                    });
                    fileTree.extraPostData = {
                        id: record_id,
                        model_name: model_name
                    };

                    rightPanelItems.push(fileTree);
                }

                var rightPanel = {
                    xtype: 'panel',
                    items: rightPanelItems,
                    region: 'east',
                    width: 250
                };

                var viewPanel = Ext.create('Ext.panel.Panel',{
                    itemId: model_name+'-'+record_id,
                    layout: 'border',
                    title: model_name+' '+record_id,
                    closable: true,
                    autoScroll: true,
                    record: rec,                    
                    items: [leftPanel, rightPanel],
                    listeners:{
                        'afterrender':function(panel){
                            codemirrorHighlight(ticket_div_id);
                            codemirrorHighlight(comment_div_id);
                            panel.query('dynamic_form_panel').first().addListener('afterupdate', function(){
                                // update status bar with save message
                                // reload grid
                                var tabPanel = panel.findParentByType('tabpanel');
                                tabPanel.query('#'+model_name).first().query('shared_dynamiceditablegrid').first().getStore().load({});
                            });
                        }                        
                    }
                });
                center_region.workArea.add(viewPanel);
                viewPanel.query('form').first().getForm().setValues(response_text.data);
                center_region.workArea.setActiveTab(center_region.workArea.items.length - 1);
            },
            failure: function(response) {
                Ext.getCmp('dynamic_forms_westregion').clearWindowStatus();
                Ext.Msg.alert('Error', 'Error getting data');
            }
        });
    },

    editRecord : function(rec){
        var self = this;
        Ext.getCmp('dynamic_forms_westregion').setWindowStatus('Getting update form...');
        Ext.Ajax.request({
            url: '/erp_forms/erp_app/desktop/dynamic_forms/forms/get',
            method: 'POST',
            params:{ // params can come from create response or grid store
                //id:(Ext.isEmpty(rec.model_name) ? rec.get("form_id") : rec.form_id),
                record_id:(Ext.isEmpty(rec.model_name) ? rec.get("id") : rec.id),
                model_name:(Ext.isEmpty(rec.model_name) ? rec.get("model_name") : rec.model_name),
                form_action: 'update'
            },
            success: function(response, options){
                Ext.getCmp('dynamic_forms_westregion').clearWindowStatus();
                formPanel = Ext.decode(response.responseText);
                if (formPanel.success === false){
                    Ext.Msg.alert('Error', formPanel.error);
                }else{
                    self.viewRecord(rec, formPanel);
                }
            },
            failure: function(response, options){
                Ext.getCmp('dynamic_forms_westregion').clearWindowStatus();
                Ext.Msg.alert('Error', 'Error getting form');
            }
        });
    },    
    
    deleteRecord : function(rec, model_name){
        var self = this;
        Ext.getCmp('dynamic_forms_westregion').setWindowStatus('Deleting record...');
        Ext.Ajax.request({
            url: '/erp_forms/erp_app/desktop/dynamic_forms/data/delete',
            method: 'POST',
            params:{
                id:rec.get("id"),
                model_name:rec.get("model_name")
            },
            success: function(response) {
                var obj =  Ext.decode(response.responseText);
                if(obj.success){
                    Ext.getCmp('dynamic_forms_westregion').clearWindowStatus();
                    self.query('shared_dynamiceditablegrid')[0].store.load();
                }
                else{
                    Ext.Msg.alert('Error', 'Error deleting record');
                    Ext.getCmp('dynamic_forms_westregion').clearWindowStatus();
                }
            },
            failure: function(response) {
                Ext.getCmp('dynamic_forms_westregion').clearWindowStatus();
                Ext.Msg.alert('Error', 'Error deleting record');
            }
        });
    },
    
    constructor : function(config) {
        config = Ext.apply({
            id:config.id,
            editable:false,
            page:true,
            pageSize: 20,
            displayMsg:'Displaying {0} - {1} of {2}',
            emptyMsg:'Empty',
            grid_listeners:{
                'itemdblclick':function(view, record){
                    Ext.getCmp(config.id).editRecord(record);
                }
            }
        }, config);

        this.callParent([config]);
    }
});
