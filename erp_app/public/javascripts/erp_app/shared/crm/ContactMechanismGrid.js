var contactPurposeStore = Ext.create('Ext.data.Store', {
    autoLoad: true,
    proxy: {
        type: 'ajax',
        url: '/erp_app/organizer/crm/contact_mechanism/contact_purposes',
        reader: {
            type: 'json',
            root: 'types'
        }
    },
    fields: [
        {
            name: 'description'
        },
        {
            name: 'id'
        }
    ]
});

Ext.define("Compass.ErpApp.Shared.Crm.ContactMechanismGrid", {
    extend: "Ext.grid.Panel",
    alias: 'widget.contactmechanismgrid',
    initComponent: function () {
        var me = this,
            config = me.initialConfig;

        var store = Ext.create('Ext.data.Store', {
            fields: config['fields'],
            autoLoad: false,
            autoSync: true,
            proxy: {
                type: 'rest',
                url: config['url'] || '/erp_app/organizer/crm/contact_mechanism/index',
                extraParams: {
                    party_id: config['partyId'],
                    contact_type: config['contactMechanism']
                },
                reader: {
                    type: 'json',
                    successProperty: 'success',
                    idProperty: 'id',
                    root: 'data',
                    totalProperty: 'totalCount',
                    messageProperty: 'message'
                },
                writer: {
                    type: 'json',
                    writeAllFields: true,
                    root: 'data'
                },
                listeners: {
                    exception: function (proxy, response, operation) {
                        Ext.MessageBox.show({
                            title: 'REMOTE EXCEPTION',
                            msg: 'Make sure an Individual or Organization is selected' + config.title,
                            icon: Ext.MessageBox.ERROR,
                            buttons: Ext.Msg.OK
                        });

                        me.setLoading(false);
                    }
                }
            },
            listeners: {
                'beforesync': function () {
                    me.setLoading(true);
                },
                'datachanged': function () {
                    me.setLoading(false);
                }
            }
        });

        this.store = store;

        this.bbar = Ext.create("Ext.PagingToolbar", {
            pageSize: 30,
            store: store,
            displayInfo: true,
            displayMsg: 'Displaying {0} - {1} of {2}',
            emptyMsg: "No " + config.title
        });

        this.callParent(arguments);
    },
    constructor: function (config) {
        config['contactPurposeStore'] = contactPurposeStore;

        if (config.columns === undefined) {
            config.columns = [];
        }

        config.columns = config.columns.concat([
            {
                header: 'Contact Purpose',
                dataIndex: 'contact_purpose_id',
                renderer: function () {
                    var record = arguments[2];
                    if (!Compass.ErpApp.Utility.isBlank(record.data['contact_purpose_id'])) {
                        return config['contactPurposeStore'].getAt(config['contactPurposeStore'].find("id", record.data['contact_purpose_id'])).get("description");
                    }
                    else {
                        return '';
                    }
                },
                editor: {
                    xtype: 'combo',
                    forceSelection: true,
                    typeAhead: true,
                    mode: 'local',
                    displayField: 'description',
                    valueField: 'id',
                    triggerAction: 'all',
                    store: config['contactPurposeStore'],
                    selectOnFocus: true
                },
                width: 200
            },
            {
                header: 'Created',
                dataIndex: 'created_at',
                renderer: Ext.util.Format.dateRenderer('m/d/Y g:i a'),
                width: 200
            },
            {
                header: 'Last Update',
                dataIndex: 'updated_at',
                renderer: Ext.util.Format.dateRenderer('m/d/Y g:i a'),
                width: 200
            }
        ]);

        if (!config.validations)
            config.validations = [];
        config.validations = config.validations.concat({
            type: 'presence',
            field: 'contact_purpose_id'
        });

        if (config.fields === undefined) {
            config.fields = [];
        }

        config.fields = config.fields.concat([
            {
                name: 'contact_purpose_id'
            },
            {
                name: 'created_at'
            },
            {
                name: 'updated_at'
            },
            {
                name: 'id'
            }
        ]);

        var Model = Ext.define(config.title, {
            extend: 'Ext.data.Model',
            fields: config.fields,
            validations: config.validations
        });

        this.editing = Ext.create('Ext.grid.plugin.RowEditing', {
            clicksToMoveEditor: 1
        });

        var toolBarItems = [
            {
                text: 'Add',
                xtype: 'button',
                iconCls: 'icon-add',
                handler: function (button) {
                    var grid = button.findParentByType('contactmechanismgrid');
                    var edit = grid.editing;
                    grid.store.insert(0, new Model());
                    edit.startEdit(0, 0);
                }
            },
            '-',
            {
                text: 'Delete',
                type: 'button',
                iconCls: 'icon-delete',
                handler: function (button) {
                    var grid = button.findParentByType('contactmechanismgrid');
                    var selection = grid.getView().getSelectionModel().getSelection()[0];
                    if (selection) {
                        var messageBox = Ext.MessageBox.confirm(
                            'Confirm', 'Are you sure?',
                            function (btn) {
                                if (btn == 'yes') {
                                    grid.store.remove(selection);
                                }
                            }
                        );
                    }
                }
            }
        ];

        if (!Ext.isEmpty(config.toolbarItems)) {
            toolBarItems = toolBarItems.concat(config.toolbarItems);
        }

        config = Ext.apply({
            layout: 'fit',
            frame: false,
            region: 'center',
            loadMask: true,
            plugins: [this.editing],
            dockedItems: {
                xtype: 'toolbar',
                docked: 'top',
                items: toolBarItems
            }
        }, config);

        this.callParent([config]);
    }
});

/**
 * PhoneNbrGrid
 * This grid extends the ContactMechanismGrid and sets it up with columns for
 * displaying phone numbers
 */
Ext.define("Compass.ErpApp.Shared.Crm.ContactMechanismGrid.PhoneNumberGrid", {
    extend: "Compass.ErpApp.Shared.Crm.ContactMechanismGrid",
    alias: 'widget.phonenumbergrid',
    initComponent: function () {
        this.callParent(arguments);
    },
    constructor: function (config) {
        config.title = 'Phone Numbers';
        config.contactMechanism = 'PhoneNumber';
        config.columns = [
            {
                header: 'Phone Number',
                dataIndex: 'phone_number',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            }
        ];
        config.fields = [
            {
                name: 'phone_number'
            }
        ];
        config.validations = [
            {
                type: 'presence',
                field: 'phone_number'
            }
        ];
        this.callParent([config]);
    }
});

/**
 * EmailAddrGrid
 * This grid extends ContactMechanismGrid and provides a column configuration for
 * displaying and editing email addresses for a given party
 */
Ext.define("Compass.ErpApp.Shared.Crm.ContactMechanismGrid.EmailAddressGrid", {
    extend: "Compass.ErpApp.Shared.Crm.ContactMechanismGrid",
    alias: 'widget.emailaddressgrid',
    initComponent: function () {
        this.callParent(arguments);
    },
    constructor: function (config) {
        config.title = 'Email Addresses';
        config.contactMechanism = 'EmailAddress';
        config.columns = [
            {
                header: 'Email Address',
                dataIndex: 'email_address',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            }
        ];
        config.fields = [
            {
                name: 'email_address'
            }
        ];
        config.validations = [
            {
                type: 'presence',
                field: 'email_address'
            }

        ];
        config.toolbarItems = [
            '-',
            {
                xtype: 'button',
                text: 'Send Email',
                iconCls: 'icon-mail',
                handler: function (btn) {
                    var required = '<span style="color:red;font-weight:bold" data-qtip="Required">*</span>',
                        grid = btn.findParentByType('emailaddressgrid'),
                        selection = grid.getView().getSelectionModel().getSelection()[0],
                        sendEmailWindow = null;

                    if (selection) {
                        if (!sendEmailWindow) {
                            var form = Ext.widget('form', {
                                layout: {
                                    type: 'vbox',
                                    align: 'stretch'
                                },
                                border: false,
                                bodyPadding: 10,
                                buttonAlign: 'center',
                                fieldDefaults: {
                                    labelAlign: 'top',
                                    labelWidth: 100,
                                    labelStyle: 'font-weight:bold'
                                },
                                items: [
                                    {
                                        xtype: 'textfield',
                                        fieldLabel: 'Send To',
                                        width: 300,
                                        name: 'send_to',
                                        vtype: 'email',
                                        value: selection.get('email_address'),
                                        afterLabelTextTpl: required,
                                        allowBlank: false
                                    },
                                    {
                                        xtype: 'textfield',
                                        fieldLabel: 'CC',
                                        width: 300,
                                        vtype: 'email',
                                        name: 'cc_email'
                                    },
                                    {
                                        xtype: 'textfield',
                                        fieldLabel: 'Subject',
                                        name: 'subject',
                                        width: 300,
                                        afterLabelTextTpl: required,
                                        allowBlank: false
                                    },
                                    {
                                        xtype: 'htmleditor',
                                        name: 'message',
                                        fieldLabel: 'Biography',
                                        height: 200,
                                        allowBlank: false
                                    }
                                ],

                                buttons: [
                                    {
                                        text: 'Cancel',
                                        handler: function () {
                                            this.up('form').getForm().reset();
                                            this.up('window').hide();
                                        }
                                    },
                                    {
                                        text: 'Send',
                                        handler: function (btn) {
                                            if (this.up('form').getForm().isValid()) {
                                                this.up('form').getForm().submit({
                                                    waitMsg: 'sending email',
                                                    url: '/erp_app/organizer/crm/send_email',
                                                    success: function (form, result) {
                                                        btn.up('form').getForm().reset();
                                                        btn.up('window').hide();
                                                        Ext.Msg.alert('Email Sent!', 'Your emails has been sent.');
                                                    },
                                                    failure: function (form, result) {
                                                        Ext.Msg.alert('Error', 'Could not send email.');
                                                    }
                                                });


                                            }
                                        }
                                    }
                                ]
                            });

                            sendEmailWindow = Ext.widget('window', {
                                title: 'Send Email',
                                closeAction: 'hide',
                                layout: 'fit',
                                resizable: true,
                                modal: true,
                                items: form,
                                defaultFocus: 'firstName'
                            });
                        }
                        sendEmailWindow.show();
                    }
                }
            }
        ];

        this.callParent([config]);
    }
});

/**
 * PostalAddrGrid
 * This extends the ContactMechanismGrid and setups up configuration for
 * displaying and editing postal addresses for a given party
 */
Ext.define("Compass.ErpApp.Shared.Crm.ContactMechanismGrid.PostalAddressGrid", {
    extend: "Compass.ErpApp.Shared.Crm.ContactMechanismGrid",
    alias: 'widget.postaladdressgrid',
    initComponent: function () {
        this.callParent(arguments);
    },
    constructor: function (config) {
        config.title = 'Postal Addresses';
        config.contactMechanism = 'PostalAddress';
        config.columns = [
            {
                header: 'Address Line 1',
                dataIndex: 'address_line_1',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            },
            {
                header: 'Address Line 2',
                dataIndex: 'address_line_2',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            },
            {
                header: 'City',
                dataIndex: 'city',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            },
            {
                header: 'State',
                dataIndex: 'state',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            },
            {
                header: 'Zip',
                dataIndex: 'zip',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            },
            {
                header: 'Country',
                dataIndex: 'country',
                editor: {
                    xtype: 'textfield'
                },
                width: 200
            }
        ];
        config.fields = [
            {
                name: 'address_line_1'
            },
            {
                name: 'address_line_2'
            },
            {
                name: 'city'
            },
            {
                name: 'state'
            },
            {
                name: 'zip'
            },
            {
                name: 'country'
            }
        ];
        config.validations = [
            {
                type: 'presence',
                field: 'address_line_1'
            },

            {
                type: 'presence',
                field: 'city'
            },

            {
                type: 'presence',
                field: 'state'
            },

            {
                type: 'presence',
                field: 'zip'
            },

            {
                type: 'presence',
                field: 'country'
            }
        ];
        config.toolbarItems = [
            '-',
            {
                xtype: 'button',
                text: 'Map It',
                iconCls: 'icon-map',
                handler: function (button) {
                    var grid = button.up('postaladdressgrid');
                    var selection = grid.getView().getSelectionModel().getSelection()[0];
                    if (selection) {
                        var addressLines;
                        if (Compass.ErpApp.Utility.isBlank(selection.get('address_line_2'))) {
                            addressLines = selection.get('address_line_1');
                        }
                        else {
                            addressLines = selection.get('address_line_1') + ' ,' + selection.get('address_line_2');
                        }

                        var fullAddress = addressLines + ' ,' + selection.get('city') + ' ,' + selection.get('state') + ' ,' + selection.get('zip') + ' ,' + selection.get('country');
                        var mapwin = Ext.create('Ext.Window', {
                            layout: 'fit',
                            title: addressLines,
                            width: 450,
                            height: 450,
                            border: false,
                            items: {
                                xtype: 'googlemappanel',
                                zoomLevel: 17,
                                mapType: 'hybrid',
                                dropPins: [
                                    {
                                        address: fullAddress,
                                        center: true,
                                        title: addressLines
                                    }
                                ]
                            }
                        });
                        mapwin.show();
                    }
                }
            }
        ];
        this.callParent([config]);
    }
});
