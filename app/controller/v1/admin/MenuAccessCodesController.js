let {
  dump
} = require('../../../helper/logs');

let tbl_menuaccesscodes = require("../../../../models").tbl_menuaccesscodes;
let Roles = require('../../../../models').tbl_usertypes;
let RoleAccess = require('../../../../models').tbl_roleaccess;
let tbl_menumodules = require('../../../../models').tbl_menumodules

const { sequelize } = require('../../../../models');
let {
  success,
  failed,
  failedValidation
} = require('../../../helper/response');
const {
  Validator
} = require('node-input-validator');
const {
  decrypter
} = require('../../../helper/crypto');
const {
  fn,
  col
} = require('../../../../models').sequelize
const {
  Op
} = require("sequelize");


exports.getMenuAccessCodesList = async function (req, res) {
  try {
    let data = {};
    const decryptedData = await decrypter(req.query);
    if (!decryptedData) {
      return failed(res, "Internal server error");
    }

    // Pagination values
    let pageSize = decryptedData.limit ? parseInt(decryptedData.limit) : 10;
    let page = decryptedData.page ? parseInt(decryptedData.page) : 1;
    let offset = pageSize * (page - 1);
    let search = decryptedData.search ? decryptedData.search : "";

    // Base params (not deleted)
    let params = { isdeleted: 0 };

    // Add search filter if provided
    if (search) {
      params[Op.or] = [
        { access_name: { [Op.substring]: search } },
        { access_code: { [Op.substring]: search } },
      ];
    }

    // Optional module filter
    if (decryptedData.moduleid) {
      params.moduleid = decryptedData.moduleid;
    }

    // Fetch data with pagination and search filters
    const menuaccesscodes = await tbl_menuaccesscodes.findAndCountAll({
      where: params,
      attributes: ["id", "access_code", "access_name", "status", "addedon"],
      limit: pageSize,
      offset: offset,
      include: [
        {
          model: tbl_menumodules,
          as: 'module',
          attributes: ['id', 'modulename'],
        }
      ]
    });

    // Format the response data
    const formattedmenuaccesscodes = menuaccesscodes.rows.map(accesscodes => ({
      id: accesscodes.id,
      access_code: accesscodes.access_code,
      access_name: accesscodes.access_name,
      status: accesscodes.status,
      addedon: accesscodes.addedon,
      moduleid: accesscodes.module ? accesscodes.module.id : null,
      modulename: accesscodes.module ? accesscodes.module.modulename : null,
    }));

    // Prepare response data
    data = {
      menuaccesscodes: {
        count: menuaccesscodes.count,
        rows: formattedmenuaccesscodes,
      },
    };

    return success(res, "Success", data);
  } catch (error) {
    return failed(res, error.message);
  }
};



//add api
exports.addMenuAccessCodes = async function (req, res) {
  try {
    let data = {};

    // Decrypt request body
    var requests = await decrypter(req.body);
    if (requests == false) {
      return failed(res, "Internal server error");
    }

    // Validate input data
    const v = new Validator(requests, {
      moduleid: "required",
      access_code: "required",
      access_name: "required",
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }


    // Check if access_code already exists and is not deleted
    const existing = await tbl_menuaccesscodes.findOne({
      where: {
        access_code: requests.access_code,
        isdeleted: 0
      }
    });

    if (existing) {
      return failed(res, "Access code already exists.");
    }

    // Prepare data for insertion
    let reqData = {
      moduleid: requests.moduleid,
      access_code: requests.access_code,
      access_name: requests.access_name,
      status: true,
      AddedOn: sequelize.literal('CURRENT_TIMESTAMP'),

    };

    // Insert new record into the database
    await tbl_menuaccesscodes.create(reqData);

    // Success response
    return success(res, "MenuAccessCodes Added Successfully", data);

  } catch (error) {
    // Log the error and return failure response
    dump("error", error);
    return failed(res, error.message);
  }
};


// Update API
exports.UpdateMenuAccessCodes = async function (req, res) {
  try {
    let data = {};

    // Decrypt the request body
    var requests = await decrypter(req.body);
    if (requests == false) {
      return failed(res, "Internal server error");
    }

    // Validate the decrypted input
    const v = new Validator(requests, {
      id: "required",
      moduleid: "required",
      access_code: "required",
      access_name: "required",
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    //Check if access_code already exists for another record
    const duplicate = await tbl_menuaccesscodes.findOne({
      where: {
        access_code: requests.access_code,
        id: { [Op.ne]: requests.id },
        isdeleted: 0
      }
    });

    if (duplicate) {
      return failed(res, "Access code already exists for another record.");
    }

    // Prepare the data for updating
    let reqData = {
      moduleid: requests.moduleid,
      access_code: requests.access_code,
      access_name: requests.access_name,
    };

    await tbl_menuaccesscodes.update(reqData, {
      where: {
        id: requests.id,
      },
    });

    // Success response
    return success(res, "MenuAccessCodes Updated Successfully", data);

  } catch (error) {
    // Error handling
    console.error("error", error);
    return failed(res, error.message);
  }
};


// Delete API
exports.DeleteMenuAccessCodes = async function (req, res) {
  try {
    let data = {};

    // Decrypt the request body
    var requests = await decrypter(req.body);
    if (requests === false) {
      return failed(res, "Internal server error");
    }

    // Validate the decrypted input
    const v = new Validator(requests, {
      id: "required|integer",
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    // Update the record to mark it as deleted
    await tbl_menuaccesscodes.update({ isdeleted: 1 }, {
      where: {
        id: requests.id,
      },
    });

    // Success response
    return success(res, "MenuAccessCode Deleted Successfully", data);
  } catch (error) {
    // Error handling
    console.error(error);
    return failed(res, error.message);
  }
};


// Update Status of Humanity Course
exports.StatusUpdateMenuAccessCodes = async function (req, res) {
  try {
    let data = {};

    // Decrypt the request body
    const requests = await decrypter(req.body);
    if (requests === false) {
      return failed(res, "Internal server error");
    }

    // Validate input data
    const v = new Validator(requests, {
      id: 'required|integer',
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    const menuaccesscodes = await tbl_menuaccesscodes.findOne({
      where: {
        id: requests.id
      }
    });

    if (!menuaccesscodes) {
      return failed(res, "MenuAccessCode not found");
    }

    // Toggle the status field (true -> false, or false -> true)
    const updatedStatus = !menuaccesscodes.status;

    // Prepare the data for updating the status
    const reqData = {
      status: updatedStatus,
    };

    // Update the status in the database
    await tbl_menuaccesscodes.update(reqData, {
      where: {
        id: requests.id
      }
    });

    // Success response
    return success(res, "MenuAccessCode status updated successfully", data);

  } catch (error) {
    // Log the error and return failure
    console.error("Error updating MenuAccessCode status:", error);
    return failed(res, error.message);
  }
};


// Get by ID
exports.GetMenuAccessCodesByID = async function (req, res) {
  try {
    let data = {};

    // Decrypt the request query or body (depending on where the ID is passed)
    var decryptedData = await decrypter(req.query);
    if (decryptedData === false) {
      return failed(res, "Internal server error");
    }

    // Validate input
    const v = new Validator(decryptedData, {
      id: "required|integer",
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    let menuaccesscodes = await tbl_menuaccesscodes.findOne({
      where: {
        id: decryptedData.id,

      },
      attributes: [
        "id",
        "access_code",
        "access_name",
        "status",
        "addedon",
      ],
      include: [
        {
          model: tbl_menumodules,
          as: 'module',
          attributes: ['id', 'modulename'],
        }
      ]
    });


    if (!menuaccesscodes) {
      return failed(res, "menuaccesscodes not found");
    }

    // Format the response data
    const formattedmenuaccesscodes = {
      id: menuaccesscodes.id,
      access_code: menuaccesscodes.access_code,
      access_name: menuaccesscodes.access_name,
      status: menuaccesscodes.status,
      addedon: menuaccesscodes.addedon,
      moduleid: menuaccesscodes.module ? menuaccesscodes.module.id : null,
      modulename: menuaccesscodes.module ? menuaccesscodes.module.modulename : null,
    };


    // Prepare response data
    data = formattedmenuaccesscodes;

    // Success response
    return success(res, "Successfully Fetched menuaccesscodes", data);

  } catch (error) {
    // Error handling
    console.error(error);
    return failed(res, error.message);
  }
};


// dropdown list for menumodules
exports.getMenuModulesDropDownList = async (req, res) => {
  try {
    let data = {};

    // Decrypt the request body
    const requests = await decrypter(req.query);
    if (requests === false) {
      return failed(res, "Internal server error");
    }


    const menumodules = await tbl_menumodules.findAndCountAll(
      {
        attributes: [
          "id",
          "modulename"
        ],
        order: [
          ['modulename', 'ASC']
        ]

      });

    data = {
      menumodules: {
        count: menumodules.count,
        rows: menumodules.rows
      },
    }

    // Success response
    return success(res, "menumodules Fetched successfully", data);

  } catch (error) {
    console.error("Error for Fetching menumodules:", error);
    return failed(res, error.message);
  }
}


// getUserType API
exports.getUserRoledropdownList = async function (req, res) {
  try {
    let data = {};
    var decryptedData = await decrypter(req.query);
    if (decryptedData == false) {
      return failed(res, "Internal server error");
    }

    // Base params (not deleted)
    let params = {
      isdeleted: 0
    };

    // Fetch data with pagination and search filters
    let userTypes = await Roles.findAndCountAll({
      where: params,
      attributes: [
        "UserTypeID",
        "UserType",
      ],
      order: [
        ['UserType', 'ASC']
      ]

    });

    // Prepare response data
    data = {
      userTypes: {
        count: userTypes.count,
        rows: userTypes.rows,
      },
    };

    // Success response
    return success(res, "Success", data);
  } catch (error) {
    // Error handling
    return failed(res, error.message);
  }
};

// get assigned access codes for a role
exports.Getroleaccesslist = async function (req, res) {
  try {
    let data = {};

    // Decrypt the request query or body (depending on where the ID is passed)
    var decryptedData = await decrypter(req.query);
    if (decryptedData === false) {
      return failed(res, "Internal server error");
    }

    // Pagination
    const search = (decryptedData.search || "").trim();
    const page = parseInt(decryptedData.page, 10) || 1;
    const limit = parseInt(decryptedData.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Validate input
    const v = new Validator(decryptedData, {
      UserTypeID: "required|integer",
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    // Build where clause
    let whereClause = {
      role_id: decryptedData.UserTypeID
    };

    if (search) {
      whereClause[Op.or] = [
        { '$menuAccess.access_name$': { [Op.substring]: search } },
        { '$menuAccess.access_code$': { [Op.substring]: search } },
        { '$menuAccess.module.modulename$': { [Op.substring]: search } }
      ];
    }

    // Query
    const roleAccessList = await RoleAccess.findAndCountAll({
      attributes: ['id'],
      where: whereClause,
      include: [
        {
          model: tbl_menuaccesscodes,
          as: 'menuAccess',
          where: { isdeleted: 0 },
          required: true,
          attributes: ['id', 'moduleid', 'access_code', 'access_name', 'status', 'addedon'],
          include: [
            {
              model: tbl_menumodules,
              as: 'module',
              attributes: ['id', 'modulename']
            }
          ]
        }
      ],
      order: [[{ model: tbl_menuaccesscodes, as: 'menuAccess' }, 'access_name', 'ASC']],
      limit,
      offset,
      subQuery: false
    });

    // Format response
    const formattedAccess = roleAccessList.rows.map(item => {
      return {
        id: item.menuAccess.id,
        access_code: item.menuAccess.access_code,
        access_name: item.menuAccess.access_name,
        status: item.menuAccess.status,
        addedon: item.menuAccess.addedon,
        moduleid: item.menuAccess.module ? item.menuAccess.module.id : null,
        modulename: item.menuAccess.module ? item.menuAccess.module.modulename : null,
      };
    });

    data = {
      roleAccessList: {
        count: roleAccessList.count,
        rows: formattedAccess,
      },
    };

    return success(res, "Access codes retrieved successfully", data);
  } catch (error) {
    return failed(res, error.message);
  }
};


// get unassigned access codes
exports.getUnassignedRoleAccessCodes = async function (req, res) {
  try {
    let data = {};

    // Decrypt request
    var decryptedData = await decrypter(req.query);
    if (decryptedData === false) {
      return failed(res, "Internal server error");
    }

    // Pagination values
    let pageSize = decryptedData.limit ? parseInt(decryptedData.limit) : 10;
    let page = decryptedData.page ? parseInt(decryptedData.page) : 1;
    let offset = pageSize * (page - 1);

    // Validation
    const v = new Validator(decryptedData, {
      UserTypeID: "required|integer",
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    const { UserTypeID } = decryptedData;
    let params = {}

    if (decryptedData.moduleid) {
      params = Object.assign(params, {
        moduleid: decryptedData.moduleid
      })
    }

    // Step 1: Find all assigned access_codes for this role
    const assignedAccess = await RoleAccess.findAll({
      where: { role_id: UserTypeID },
      attributes: ['access_code']
    });

    const assignedCodes = assignedAccess.map(item => item.access_code);

    // Step 2: Find access codes from menuaccesscodes NOT in assigned list
    const unassignedList = await tbl_menuaccesscodes.findAndCountAll({
      where: {
        ...params,
        isdeleted: 0,
        access_code: {
          [Op.notIn]: assignedCodes.length > 0 ? assignedCodes : ['']
        }
      },
      attributes: ['id', 'access_code', 'access_name', 'status', 'addedon'],
      include: [
        {
          model: tbl_menumodules,
          as: 'module',
          attributes: ['id', 'modulename']
        }
      ],
      limit: pageSize,
      offset: offset
    });

    const formattedUnassigned = unassignedList.rows.map(item => {
      return {
        id: item.id,
        access_code: item.access_code,
        access_name: item.access_name,
        status: item.status,
        addedon: item.addedon,
        moduleid: item.module ? item.module.id : null,
        modulename: item.module ? item.module.modulename : null
      };
    });


    data = {
      unassignedAccessList: {
        count: unassignedList.count,
        rows: formattedUnassigned
      }
    };

    return success(res, "Unassigned access codes retrieved successfully", data);
  } catch (error) {
    return failed(res, error.message);
  }
};


// POST: Assign access codes with access_name to a role
exports.assignAccessCodesToRole = async function (req, res) {
  try {
    let data = {};

    // Decrypt request
    const decryptedData = await decrypter(req.body);
    if (decryptedData === false) {
      return failed(res, "Internal server error");
    }

    // Validate request
    const v = new Validator(decryptedData, {
      UserTypeID: "required|integer",
      access_codes: "required|array"
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    const { UserTypeID, access_codes } = decryptedData;

    if (!Array.isArray(access_codes) || access_codes.length === 0) {
      return failed(res, "No access codes provided to assign");
    }

    const accessCodeIds = access_codes.map(a => a.access_code);

    // Fetch existing access_code IDs for this role
    const existingAccess = await RoleAccess.findAll({
      where: {
        role_id: UserTypeID,
        access_code: {
          [Op.in]: accessCodeIds
        }
      },
      attributes: ['access_code']
    });

    const existingCodeIds = existingAccess.map(item => item.access_code);

    // Filter out duplicates
    const newAssignments = access_codes.filter(
      item => !existingCodeIds.includes(item.access_code)
    );

    if (newAssignments.length === 0) {
      return failed(res, "selected access codes are already assigned to this role.");
    }

    // Prepare data to insert
    const insertData = newAssignments.map(item => ({
      role_id: UserTypeID,
      access_code: item.access_code,
      access_name: item.access_name || '', // fallback to empty if not provided
      status: 1,
      created_at: new Date()
    }));

    // Bulk insert
    await RoleAccess.bulkCreate(insertData);

    return success(res, "Access codes assigned successfully", data);

  } catch (error) {
    return failed(res, error.message);
  }
};


// DELETE: Remove access code from assigned role access
exports.deleteAssignedRoleAccess = async function (req, res) {
  try {
    let data = {};

    // Decrypt request
    const decryptedData = await decrypter(req.body);
    if (decryptedData === false) {
      return failed(res, "Internal server error");
    }

    // Validate input
    const v = new Validator(decryptedData, {
      UserTypeID: "required|integer",
      access_code: "required|integer"
    });

    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    const { UserTypeID, access_code } = decryptedData;

    // Delete the record
    const deleted = await RoleAccess.destroy({
      where: {
        role_id: UserTypeID,
        access_code: access_code
      }
    });

    if (deleted === 0) {
      return failed(res, "No matching assigned access found to delete");
    }

    return success(res, "Access code unassigned from role successfully", data);

  } catch (error) {
    return failed(res, error.message);
  }
};

exports.getMenuAccessCodesListWithModules = async function (req, res) {
  try {
    let data = {};
    var decryptedData = await decrypter(req.query);
    if (decryptedData == false) {
      return failed(res, "Internal server error");
    }

    let pageSize = decryptedData.limit ? parseInt(decryptedData.limit) : 10;
    let page = decryptedData.page ? parseInt(decryptedData.page) : 1;
    let offset = pageSize * (page - 1);
    let search = decryptedData.search ? decryptedData.search : "";

    let params = { isdeleted: 0 };

    if (search) {
      params = {
        ...params,
        [Op.or]: [
          { access_name: { [Op.substring]: search } },
          { access_code: { [Op.substring]: search } }
        ]
      };
    }

    if (decryptedData.moduleid) {
      params = Object.assign(params, {
        moduleid: decryptedData.moduleid
      });
    }

    const menuaccesscodes = await tbl_menuaccesscodes.findAndCountAll({
      where: params,
      attributes: [
        "id",
        "access_code",
        "access_name",
        "status",
        "addedon",
      ],
      limit: pageSize,
      offset: offset,
      include: [
        {
          model: tbl_menumodules,
          as: 'module',
          attributes: ['id', 'modulename'],
        }
      ]
    });

    const formattedmenuaccesscodes = menuaccesscodes.rows.map(accesscodes => {
      return {
        id: accesscodes.id,
        access_code: accesscodes.access_code,
        access_name: accesscodes.access_name,
        status: accesscodes.status,
        addedon: accesscodes.addedon,
        moduleid: accesscodes.module ? accesscodes.module.id : null,
        modulename: accesscodes.module ? accesscodes.module.modulename : null,
      };
    });

    const menumodules = await tbl_menumodules.findAndCountAll({
      attributes: ["id", "modulename"],
      order: [["modulename", "ASC"]],
    });

    data = {
      menuaccesscodes: {
        count: menuaccesscodes.count,
        rows: formattedmenuaccesscodes,
      },
      menumodules: {
        count: menumodules.count,
        rows: menumodules.rows
      }
    };

    return success(res, "Success", data);
  } catch (error) {
    return failed(res, error.message);
  }
};


exports.getRolesWithModules = async (req, res) => {
  try {
    let data = {};

    // Decrypt the request
    const requests = await decrypter(req.query);
    if (requests === false) {
      return failed(res, "Internal server error");
    }

    // Base params
    let params = { isdeleted: 0 };

    // Fetch Roles
    const userTypes = await Roles.findAndCountAll({
      where: params,
      attributes: ["UserTypeID", "UserType"],
      order: [["UserType", "ASC"]],
    });

    // Fetch Menu Modules
    const menumodules = await tbl_menumodules.findAndCountAll({
      attributes: ["id", "modulename"],
      order: [["modulename", "ASC"]],
    });

    // Prepare combined response
    data = {
      userTypes: {
        count: userTypes.count,
        rows: userTypes.rows,
      },
      menumodules: {
        count: menumodules.count,
        rows: menumodules.rows,
      },
    };

    // Success response
    return success(res, "Roles and Menu Modules fetched successfully", data);

  } catch (error) {
    console.error("getRolesAndMenuModulesDropDownList error:", error);
    return failed(res, error.message);
  }
};


exports.createMenuModule = async (req, res) => {
  try {
    let data = {};

    // Decrypt the request body
    const requests = await decrypter(req.body);
    if (requests === false) {
      return failed(res, "Internal server error");
    }

    // Validate input data
    const v = new Validator(requests, {
      modulename: "required",
    }); 
    const matched = await v.check();
    if (!matched) {
      return failedValidation(res, v);
    }

    // Check if module already exists
    const existingModule = await tbl_menumodules.findOne({
      where: {
        modulename: requests.modulename,
      }
    });

    if (existingModule) {
      return failed(res, "Module already exists.");
    }

    // Prepare data for insertion
    let reqData = {
      modulename: requests.modulename,
      moduledesc: requests.moduledesc || '',
      addedon: new Date() // Use current date for addedon
    };

    // Insert new record into the database
    await tbl_menumodules.create(reqData);

    // Success response
    return success(res, "Menu Module Added Successfully", data);

  } catch (error) {
    // Log the error and return failure response
    console.error("Error adding Menu Module:", error);
    return failed(res, error.message);
  }
}