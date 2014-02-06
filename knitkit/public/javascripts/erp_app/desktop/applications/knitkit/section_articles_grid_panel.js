Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.SectionArticlesGridPanel",{
  extend:"Ext.grid.Panel",
  header: false,
  alias:'widget.knitkit_sectionarticlesgridpanel',
  detachArticle : function(article_id){
    var self = this;
    this.initialConfig['centerRegion'].setWindowStatus('Detaching...');
    Ext.Ajax.request({
      url: '/knitkit/erp_app/desktop/section/detach_article',
      method: 'POST',
      params:{
        id:self.initialConfig['sectionId'],
        article_id:article_id
      },
      success: function(response) {
        var obj =  Ext.decode(response.responseText);
        if(obj.success){
          self.initialConfig['centerRegion'].clearWindowStatus();
          self.getStore().load();
        }
        else{
          Ext.Msg.alert('Error', 'Error detaching Article');
          self.initialConfig['centerRegion'].clearWindowStatus();
        }
      },
      failure: function(response) {
        self.initialConfig['centerRegion'].clearWindowStatus();
        Ext.Msg.alert('Error', 'Error detaching Article');
      }
    });
  },
    
  editArticle : function(record){
    var self = this;
		var itemId = 'editArticle-'+record.get('id');
		var editArticleWindow = Ext.ComponentQuery.query('#'+itemId).first();
    var editFormItems = [{
                xtype:'hidden',
                allowBlank:false,
                name:'id',
                value: record.data.id
            },
            {
              xtype:'textfield',
              fieldLabel:'Title',
              allowBlank:false,
              name:'title',
              value: record.data.title
            },
            {
              xtype:'radiogroup',
              fieldLabel:'Display title?',
              name:'display_title',
              columns:2,
              items:[
              {
                boxLabel:'Yes',
                name:'display_title',
                inputValue: 'yes',
                checked:record.data.display_title
              },
              {
                boxLabel:'No',
                name:'display_title',
                inputValue:'no',
                checked:!record.data.display_title
              }]
            },
              {
                xtype:'textfield',
                fieldLabel:'Internal ID',
                allowBlank:true,
                name:'internal_identifier',
                value: record.data.internal_identifier
            }
          ];
		if (self.alias.first() == 'widget.knitkit_pagearticlesgridpanel'){
			editFormItems = editFormItems.concat([
                {
                    xtype:'textfield',
                    fieldLabel:'Content Area',
                    name:'content_area',
                    value:record.data.content_area
                },
                {
                    xtype:'numberfield',
                    fieldLabel:'Position',
                    name:'position',
                    value:record.data.position
                }
            ]);
		} 
		else {
			if (self.alias.first() == 'widget.knitkit_blogarticlesgridpanel'){
        editFormItems = editFormItems.concat( [
                    {
                        xtype:'textfield',
                        fieldLabel:'Tags',
                        allowBlank:true,
                        name:'tags',
                        value:record.data.tag_list
                    }
				]);
			}
		}
    editFormItems = editFormItems.concat([
            {
              xtype: 'displayfield',
              fieldLabel: 'Created At',
              name: 'created_at',
              value: record.data.created_at
            },
            {
              xtype: 'displayfield',
              fieldLabel: 'Updated At',
              name: 'updated_at',
              value: record.data.updated_at
            }
    ]);
    if(Ext.isEmpty(editArticleWindow)){  
        editArticleWindow = Ext.create("Ext.window.Window",{
          layout:'fit',
          width:375,
          title:'Edit Article',
          itemId:itemId,
          plain: true,
          buttonAlign:'center',
          items: {
            xtype: 'form',
            labelWidth: 110,
            frame:false,
            bodyStyle:'padding:5px 5px 0',
            width: 425,
            url:'/knitkit/erp_app/desktop/articles/update/' + self.sectionId,
            defaults: {
              width: 225
            },
            items: editFormItems
          },
          buttons: [{
            text:'Submit',
            listeners:{
              'click':function(button){
                var window = button.findParentByType('window');
                var formPanel = window.query('form')[0];
                self.initialConfig['centerRegion'].setWindowStatus('Updating article...');
                formPanel.getForm().submit({
                  reset:false,
                  success:function(form, action){
                    self.initialConfig['centerRegion'].clearWindowStatus();
                    var obj = Ext.decode(action.response.responseText);
                    if(obj.success){
                      self.getStore().load();
                      if(formPanel.getForm().findField('tag_list')){
                        var tag_list = formPanel.getForm().findField('tag_list').getValue();
                        record.set('tag_list', tag_list);
                      }
                      if(formPanel.getForm().findField('content_area')){
                        var content_area = formPanel.getForm().findField('content_area').getValue();
                        record.set('content_area', content_area);
                      }
                      if(formPanel.getForm().findField('position')){
                        var position = formPanel.getForm().findField('position').getValue();
                        record.set('position', position);
                      }
                      editArticleWindow.close();
                    }
                    else{
                      Ext.Msg.alert("Error", obj.msg);
                    }
                  },
                  failure:function(form, action){
                    self.initialConfig['centerRegion'].clearWindowStatus();
                    Ext.Msg.alert("Error", "Error updating article");
                  }
                });
              }
            }
          },{
            text: 'Close',
            handler: function(){
              editArticleWindow.close();
            }
          }]
        });
		}
    editArticleWindow.show();
  },

  initComponent: function() {
    this.callParent([arguments]);
    this.getStore().load();
  },
  
  constructor : function(config) {
    var self = this;
    var sectionId = config['sectionId'];

    // create the Data Store
    var store = Ext.create('Ext.data.Store', {
      pageSize: 10,
      proxy: {
        type: 'ajax',
        url:'/knitkit/erp_app/desktop/articles/get/' + sectionId,
        reader: {
          type: 'json',
          root: 'data'
        }
      },
      remoteSort: true,
      fields:[
          {name:'id'},
          {name:'title'},
          {name:'tag_list'},
          {name:'excerpt_html'},
          {name:'position'},
          {name:'content_area'},
          {name:'body_html'},
          {name:'internal_identifier'},
          {name:'display_title'},
          {name:'created_at'},
          {name:'updated_at'}
      ]
    });

    var overiddenColumns = [{
      header:'Title',
      sortable:true,
      dataIndex:'title',
      width:110
    }];

    if(!Compass.ErpApp.Utility.isBlank(config['columns'])){
      overiddenColumns = overiddenColumns.concat(config['columns']);
    }

       overiddenColumns = overiddenColumns.concat([
        {
            menuDisabled:true,
            resizable:false,
            xtype:'actioncolumn',
            ui: 'wysiwyg',
            align:'center',
            width:30,
            items:[{
                icon:'/images/icons/edit/edit_16x16.png',
								iconCls:'actioncolumn_hover',
                tooltip:'Edit the article content',
                handler :function(grid, rowIndex, colIndex){
                    var rec = grid.getStore().getAt(rowIndex);
                    self.initialConfig['centerRegion'].editContent(rec.get('title'), rec.get('id'), rec.get('body_html'), grid.ownerCt.initialConfig.siteId, grid.ownerCt.initialConfig.contentType, grid.getStore());
                }
            }]
        }]);
        
        if (currentUser.hasCapability('edit','Content'))
        {
            overiddenColumns = overiddenColumns.concat([
            {
                menuDisabled:true,
                resizable:false,
                xtype:'actioncolumn',
                ui: 'attributes',
                align:'center',
                width:30,
                items:[{
                    icon:'/images/icons/doc_settings/doc_settings_16x16.png',
                    iconCls:'actioncolumn_hover',
                    tooltip:'Edit Content Attributes',
                    handler :function(grid, rowIndex, colIndex){
                        var rec = grid.getStore().getAt(rowIndex);
                        self.editArticle(rec);
                    }
                }]
            }]);
        }

        if (currentUser.hasCapability('delete','Content'))
        {
            overiddenColumns = overiddenColumns.concat([
            {
                menuDisabled:true,
                resizable:false,
                xtype:'actioncolumn',
                //ui: 'detach',
                align:'center',
                width:30,
                items:[{
                    icon:'/images/icons/delete/delete_16x16.png',
										iconCls:'actioncolumn_hover',
                    tooltip:'Delete Article from Section',
                    handler :function(grid, rowIndex, colIndex){
                        var rec = grid.getStore().getAt(rowIndex);
                        var id = rec.get('id');
                        var messageBox = Ext.MessageBox.confirm(
                            'Confirm', 'Are you sure? NOTE: Article may be orphaned',
                            function(btn){
                                if (btn == 'yes'){
                                    self.detachArticle(id);
                                }
                            }
                            );
                    }
                }]
            }
            ]);
        }

    var addFormItems = [
    {
      xtype:'textfield',
      fieldLabel:'Title',
      allowBlank:false,
      name:'title'
    },
    {
      xtype:'radiogroup',
      fieldLabel:'Display title?',
      name:'display_title',
      columns:2,
      items:[
      {
        boxLabel:'Yes',
        name:'display_title',
        inputValue: 'yes',
        checked:true
      },

      {
        boxLabel:'No',
        name:'display_title',
        inputValue: 'no'
      }]
    },
    {
      xtype:'textfield',
      fieldLabel:'Internal ID',
      allowBlank:true,
      name:'internal_identifier'
    }
    ];

    if(!Compass.ErpApp.Utility.isBlank(config['addFormItems'])){
      addFormItems = addFormItems.concat(config['addFormItems']);
    }
    
        var tbarItems = [];

        if (currentUser.hasCapability('create','Content'))
        {
            tbarItems.push(
            {
                text: 'Create New Article',
                iconCls: 'icon-add',
                handler : function(){
                    var addArticleWindow = new Ext.Window({
                        layout:'fit',
                        width:375,
                        title:'Create New Article',
                        plain: true,
                        buttonAlign:'center',
                        items: new Ext.FormPanel({
                            labelWidth: 110,
                            frame:false,
                            bodyStyle:'padding:5px 5px 0',
                            width: 425,
                            url:'/knitkit/erp_app/desktop/articles/new/' + self.initialConfig['sectionId'],
                            defaults: {
                                width: 257
                            },
                            items: addFormItems
                        }),
                        buttons: [{
                            text:'Submit',
                            listeners:{
                                'click':function(button){
                                    var window = button.findParentByType('window');
                                    var formPanel = window.query('form')[0];
                                    self.initialConfig['centerRegion'].setWindowStatus('Creating article...');
                                    formPanel.getForm().submit({
                                        reset:true,
                                        success:function(form, action){
                                            self.initialConfig['centerRegion'].clearWindowStatus();
                                            var obj =  Ext.decode(action.response.responseText);
                                            if(obj.success){
                                                self.getStore().load();
                                            }
                                            else{
                                                Ext.Msg.alert("Error", obj.msg);
                                            }
                                            addArticleWindow.close();

                                        },
                                        failure:function(form, action){
                                            self.initialConfig['centerRegion'].clearWindowStatus();
                                            Ext.Msg.alert("Error", "Error creating article");
                                        }
                                    });
                                }
                            }
                        },{
                            text: 'Close',
                            handler: function(){
                                addArticleWindow.close();
                            }
                        }]
                    });
                    addArticleWindow.show();
                }
            });
        }

        if (currentUser.hasCapability('add_existing','Content'))
        {
            tbarItems.push(
            {
                text: 'Use Existing Article',
                iconCls: 'icon-copy',
                handler : function(){
                    var addExistingArticleWindow = new Ext.Window({
                        layout:'fit',
                        width:375,
                        title:'Attach Existing Article',
                        height:130,
                        plain: true,
                        buttonAlign:'center',
                        items: new Ext.FormPanel({
                            labelWidth: 75,
                            frame:false,
                            bodyStyle:'padding:5px 5px 0',
                            width: 425,
                            url:'/knitkit/erp_app/desktop/articles/add_existing/' + self.initialConfig['sectionId'],
                            items:[
                            {
                                itemId: 'available_articles_filter_combobox',
                                xtype:'combo',
                                hiddenName:'website_id',
                                name:'website_id',
                                labelWidth: 50,
                                width:350,
                                loadingText:'Retrieving Websites...',
                                store:Ext.create('Ext.data.Store',{
                                    autoLoad: true,
                                    proxy:{
                                        type:'ajax',
                                        reader:{
                                            type:'json',
                                            root:'websites'
                                        },
                                        extraParams:{
                                            section_id:self.initialConfig['sectionId']
                                        },
                                        url:'/knitkit/erp_app/desktop/section/available_articles_filter'
                                    },
                                    fields:[
                                    {
                                        name:'id'
                                    },
                                    {
                                        name:'internal_identifier'

                                    },
                                    {
                                        name:'name'

                                    }],
                                    listeners:{
                                        'load':function(store){
                                            available_articles_filter_combobox = Ext.ComponentQuery.query('#available_articles_filter_combobox')[0];
                                            available_articles_filter_combobox.select(0);
                                            available_articles_filter_combobox.fireEvent('select');
                                        }
                                    }
                                }),
                                forceSelection:true,
                                fieldLabel:'Filter By',
                                queryMode: 'local',
                                autoSelect:true,
                                typeAhead: true,
                                displayField:'name',
                                valueField:'id',
                                triggerAction: 'all',
                                allowBlank:false,
                                listeners:{
                                    'select':function(combo, records){
                                        available_articles_combobox = Ext.ComponentQuery.query('#available_articles_combobox')[0];
                                        available_articles_combobox.getPicker().setLoading(false);
                                        available_articles_combobox.getStore().load({
                                            params:{
                                                section_id: self.initialConfig['sectionId'],
                                                website_id: Ext.ComponentQuery.query('#available_articles_filter_combobox')[0].getValue()
                                            }
                                        });
                                    }
                                }
                            },
                            {
                                xtype:'combo',
                                itemId:'available_articles_combobox',
                                hiddenName:'article_id',
                                name:'article_id',
                                labelWidth: 50,
                                width:350,
                                loadingText:'Retrieving Articles...',
                                store:Ext.create('Ext.data.Store',{
                                    autoLoad: false,
                                    remoteFilter: true,
                                    proxy:{
                                        type:'ajax',
                                        reader:{
                                            type:'json',
                                            root:'articles'
                                        },
                                        extraParams:{
                                            section_id:self.initialConfig['sectionId']
                                        },
                                        url:'/knitkit/erp_app/desktop/section/available_articles'
                                    },
                                    fields:[
                                    {
                                        name:'id'
                                    },
                                    {
                                        name:'internal_identifier'

                                    },
                                    {
                                        name:'combobox_display_value'
                                    }
                                    ],
                                    listeners: {
                                        'beforeload':function(store){
                                            Ext.apply(store.getProxy().extraParams, {
                                                website_id: Ext.ComponentQuery.query('#available_articles_filter_combobox')[0].getValue()
                                            });
                                        },
                                        'load':function(store, records){
                                            available_articles_combobox = Ext.ComponentQuery.query('#available_articles_combobox')[0];
                                            available_articles_combobox.setValue(store.getAt(0).data.id);
                                        }                                                                                                                    
                                    }
                                }),
                                queryMode: 'local',
                                forceSelection:true,
                                fieldLabel:'Article',
                                autoSelect:true,
                                typeAhead: true,
                                displayField:'combobox_display_value',
                                valueField:'id',
                                triggerAction: 'all',
                                allowBlank:false,
                                loadMask: false
                            }
                            ]
                        }),
                        buttons: [{
                            text:'Submit',
                            listeners:{
                                'click':function(button){
                                    var window = button.findParentByType('window');
                                    var formPanel = window.query('form')[0];
                                    self.initialConfig['centerRegion'].setWindowStatus('Attaching article...');
                                    formPanel.getForm().submit({
                                        reset:true,
                                        success:function(form, action){
                                            self.initialConfig['centerRegion'].clearWindowStatus();
                                            var obj =  Ext.decode(action.response.responseText);
                                            if(obj.success){
                                                self.getStore().load();
                                                window.close();
                                            }else{
                                                Ext.Msg.alert("Error", "Error Attaching article");
                                            }
                                        },
                                        failure:function(form, action){
                                            self.initialConfig['centerRegion'].clearWindowStatus();
                                            Ext.Msg.alert("Error", "Error Attaching article");
                                        }
                                    });
                                }
                            }
                        },{
                            text: 'Close',
                            handler: function(){
                                addExistingArticleWindow.close();
                            }
                        }]
                    });
                    addExistingArticleWindow.show();
                }
            }
            );
        }
    
    config['columns'] = overiddenColumns;
    config = Ext.apply({
      store:store,
      tbar: tbarItems,
      bbar: new Ext.PagingToolbar({
        store: store,
        displayInfo: true,
        displayMsg: '{0} - {1} of {2}',
        emptyMsg: "Empty"
      })
    }, config);
  
    this.callParent([config]);
  }
});

Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.PageArticlesGridPanel",{
  extend:"Compass.ErpApp.Desktop.Applications.Knitkit.SectionArticlesGridPanel",
  alias:'widget.knitkit_pagearticlesgridpanel',

  constructor : function(config) {
    config['contentType'] = 'article';
    var fm = Ext.form;
    config = Ext.apply({
      columns:[{
        sortable:true,
        resizable:false,
        header:'Area',
        dataIndex:'content_area',
        width:80,
        editable:false,
        editor: new fm.TextField({
          allowBlank: false
        })
      },
      {
        menuDisabled:true,
        resizable:false,
        sortable:true,
        ui: 'ordered-list',
        dataIndex:'position',
        width:30,
        editable:false,
        tooltip: "Edit article attributes to change order of article rendering",
        editor: new fm.TextField({
          allowBlank: true
        })
      }],
      addFormHeight:160,
      addFormItems:[
      {
        xtype:'hidden',
        allowBlank:false,
        name:'id'
      },
      {
        xtype:'textfield',
        fieldLabel:'Content Area',
        name:'content_area'
      },
      {
        xtype:'numberfield',
        fieldLabel:'Position',
        name:'position'
      }
      ]
    }, config);

    this.callParent([config]);
  }
});

Ext.define("Compass.ErpApp.Desktop.Applications.Knitkit.BlogArticlesGridPanel",{
  extend:"Compass.ErpApp.Desktop.Applications.Knitkit.SectionArticlesGridPanel",
  alias:'widget.knitkit_blogarticlesgridpanel',

  constructor : function(config) {
    var self = this;
    config['contentType'] = 'blog';
    config = Ext.apply({
      addFormHeight:200,
      addFormItems:[
      {
        xtype:'hidden',
        allowBlank:false,
        name:'id'
      },
      {
        xtype:'textfield',
        fieldLabel:'Tags',
        allowBlank:true,
        name:'tags'
      }
      ],
      columns:[{
        menuDisabled:true,
        resizable:false,
        xtype:'actioncolumn',
        header:'Comments',
        align:'center',
        width:60,
        items:[{
          icon:'/images/icons/document_text/document_text_16x16.png',
          tooltip:'Comments',
          handler :function(grid, rowIndex, colIndex){
            var rec = grid.getStore().getAt(rowIndex);
            self.initialConfig['centerRegion'].viewContentComments(rec.get('id'), rec.get('title') + ' - Comments');
          }
        }]
      },{
        menuDisabled:true,
        resizable:false,
        xtype:'actioncolumn',
        header:'Excerpt',
        align:'center',
        width:50,
        items:[{
          icon:'/images/icons/edit/edit_16x16.png',
          tooltip:'Edit Excerpt',
          handler :function(grid, rowIndex, colIndex){
            var rec = grid.getStore().getAt(rowIndex);
            self.initialConfig['centerRegion'].editExcerpt(rec.get('title') + ' - Excerpt', rec.get('id'), rec.get('excerpt_html'), self.initialConfig.siteId, grid.getStore());
          }
        }]
      }]
    }, config);

    this.callParent([config]);
  }
});