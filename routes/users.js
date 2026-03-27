var express = require("express");
var router = express.Router();
let { checkLogin, CheckPermission } = require('../utils/authHandler')
let { userCreateValidator
    , userUpdateValidator
    , handleResultValidator } = require('../utils/validatorHandler')
let userController = require("../controllers/users");
let { uploadExcel } = require('../utils/upload');
let roleModel = require('../schemas/roles');
let { RandomToken } = require('../utils/GenToken');
let { sendMailPassword } = require('../utils/senMailHandler');
let exceljs = require('exceljs');
let path = require('path');


router.post("/import", checkLogin, CheckPermission("ADMIN"), uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        return res.status(400).send({ message: "File không được để trống" });
    }

    let userRole = await roleModel.findOne({ name: "user" });
    if (!userRole) {
        return res.status(400).send({ message: "Role 'user' không tồn tại trong hệ thống" });
    }

    let workbook = new exceljs.Workbook();
    let pathFile = path.join(__dirname, "../uploads", req.file.filename);
    await workbook.xlsx.readFile(pathFile);
    let worksheet = workbook.worksheets[0];

    let result = [];
    for (let row = 2; row <= worksheet.rowCount; row++) {
        const cells = worksheet.getRow(row);
        let username = cells.getCell(1).value;
        let emailCell = cells.getCell(2).value;
        // Xử lý trường hợp cell là công thức (formula cell)
        let email = (emailCell && typeof emailCell === 'object') ? emailCell.result : emailCell;

        if (!username || !email) {
            result.push({ row, error: "username hoặc email không được để trống" });
            continue;
        }

        let password = RandomToken(16);
        try {
            let newUser = userController.CreateAnUser(
                String(username),
                password,
                String(email),
                userRole._id
            );
            await newUser.save();
            await sendMailPassword(String(email), password);
            result.push({ username, email, message: "Tạo tài khoản thành công, email đã được gửi" });
        } catch (error) {
            result.push({ username, email, error: error.message });
        }
    }
    res.send(result);
});

router.get("/", checkLogin, CheckPermission("ADMIN")
    , async function (req, res, next) {
        let users = await userController.GetAllUser();
        res.send(users);
    });

router.get("/:id", async function (req, res, next) {
    try {
        let result = await userModel
            .find({ _id: req.params.id, isDeleted: false })
        if (result.length > 0) {
            res.send(result);
        }
        else {
            res.status(404).send({ message: "id not found" });
        }
    } catch (error) {
        res.status(404).send({ message: "id not found" });
    }
});

router.post("/", userCreateValidator, handleResultValidator,
    async function (req, res, next) {
        try {
            let newItem = userController.CreateAnUser(
                req.body.username,
                req.body.password, req.body.email, req.body.fullName,
                req.body.avatarUrl, req.body.role, req.body.status, req.body.loginCount
            )
            await newItem.save();

            // populate cho đẹp
            let saved = await userModel
                .findById(newItem._id)
            res.send(saved);
        } catch (err) {
            res.status(400).send({ message: err.message });
        }
    });

router.put("/:id", userUpdateValidator, handleResultValidator, async function (req, res, next) {
    try {
        let id = req.params.id;
        //c1
        let updatedItem = await
            userModel.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedItem)
            return res.status(404).send({ message: "id not found" });
        //c2
        // let updatedItem = await userModel.findById(id);
        // if (updatedItem) {
        //     let keys = Object.keys(req.body);
        //     for (const key of keys) {
        //         getUser[key] = req.body[key]
        //     }
        // }
        // await updatedItem.save()
        let populated = await userModel
            .findById(updatedItem._id)
        res.send(populated);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

router.delete("/:id", async function (req, res, next) {
    try {
        let id = req.params.id;
        let updatedItem = await userModel.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );
        if (!updatedItem) {
            return res.status(404).send({ message: "id not found" });
        }
        res.send(updatedItem);
    } catch (err) {
        res.status(400).send({ message: err.message });
    }
});

module.exports = router;