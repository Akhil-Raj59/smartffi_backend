import fs from "fs/promises";
import cloudinary from "cloudinary";

import asyncHandler from "../middleware/asyncHandler.middleware.js";
import Course from "../models/course.model.js";
import AppError from "../utils/AppError.js";

const uploadFileToCloudinary = async (
    filePath,
    folder = "lms",
    resourceType = "image"
) => {

    const options = {
        folder,
        resource_type: resourceType,
    };
    if (resourceType === "video") {
        options.chunk_size = 50000000;
    }

    const result = await cloudinary.v2.uploader.upload(
        filePath,
        options
    );

    return result;
};
const getAllCourses = asyncHandler(async (_req, res) => {

    const courses = await Course.find({})
        .select("-lectures");

    res.status(200).json({
        success: true,
        message: "All courses fetched successfully",
        courses,
    });
});
const createCourse = asyncHandler(async (req, res, next) => {

    const {
        title,
        description,
        category,
        createdBy,
    } = req.body;

    if (
        !title ||
        !description ||
        !category ||
        !createdBy
    ) {
        return next(
            new AppError(
                "All fields are required",
                400
            )
        );
    }

    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
    });

    if (req.file) {

        try {

            const result =
                await uploadFileToCloudinary(
                    req.file.path,
                    "lms",
                    "image"
                );

            if (result) {

                course.thumbnail = {
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                };
            }
            await fs.rm(req.file.path, {
                force: true,
            });

        } catch (error) {
            await fs.rm(req.file.path, {
                force: true,
            });

            return next(
                new AppError(
                    "Thumbnail upload failed",
                    500
                )
            );
        }
    }

    await course.save();

    res.status(201).json({
        success: true,
        message: "Course created successfully",
        course,
    });
});
const getLecturesByCourseId =asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
        return next(
            new AppError(
                "Course not found",
                404
            )
        );
    }

    res.status(200).json({
        success: true,
        message:
            "Course lectures fetched successfully",
        lectures: course.lectures,
    });
});
const addLectureToCourseById =asyncHandler(async (req, res, next) => {

    const { title, description } = req.body;

    const { id } = req.params;

    if (!title || !description) {
        return next(
            new AppError(
                "Title and description are required",
                400
            )
        );
    }

    const course = await Course.findById(id);

    if (!course) {
        return next(
            new AppError(
                "Course not found",
                404
            )
        );
    }

    let lectureData = {};


    if (req.file) {

        try {

            const result =
                await uploadFileToCloudinary(
                    req.file.path,
                    "lms",
                    "video"
                );

            if (result) {

                lectureData = {
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                };
            }
            await fs.rm(req.file.path, {
                force: true,
            });

        } catch (error) {
            await fs.rm(req.file.path, {
                force: true,
            });

            return next(
                new AppError(
                    "Lecture upload failed",
                    500
                )
            );
        }
    }
    course.lectures.push({
        title,
        description,
        lecture: lectureData,
    });

    course.numberOfLectures =
        course.lectures.length;

    await course.save();

    res.status(200).json({
        success: true,
        message:
            "Lecture added successfully",
        course,
    });
});
const removeLectureFromCourse =asyncHandler(async (req, res, next) => {
 const { courseId, lectureId } = req.query;

    if (!courseId || !lectureId) {
        return next(
            new AppError(
                "Course ID and Lecture ID are required",
                400
            )
        );
    }

    const course = await Course.findById(courseId);

    if (!course) {
        return next(
            new AppError(
                "Course not found",
                404
            )
        );
    }


    const lectureIndex =
        course.lectures.findIndex(
            (lecture) =>
                lecture._id.toString() ===
                lectureId.toString()
        );

    if (lectureIndex === -1) {
        return next(
            new AppError(
                "Lecture not found",
                404
            )
        );
    }

    const lecture =
        course.lectures[lectureIndex];


    if (
        lecture.lecture &&
        lecture.lecture.public_id
    ) {

        await cloudinary.v2.uploader.destroy(
            lecture.lecture.public_id,
            {
                resource_type: "video",
            }
        );
    }


    course.lectures.splice(lectureIndex, 1);

    course.numberOfLectures =
        course.lectures.length;

    await course.save();

    res.status(200).json({
        success: true,
        message:
            "Lecture removed successfully",
    });
});
const updateCourseById =asyncHandler(async (req, res, next) => {

    const { id } = req.params;


    const updatedCourse =
        await Course.findByIdAndUpdate(
            id,
            {
                $set: req.body,
            },
            {
                new: true,
                runValidators: true,
            }
        );

    if (!updatedCourse) {
        return next(
            new AppError(
                "Course not found",
                404
            )
        );
    }

    res.status(200).json({
        success: true,
        message:
            "Course updated successfully",
        course: updatedCourse,
    });
});
const deleteCourseById =asyncHandler(async (req, res, next) => {

    const { id } = req.params;

    const course = await Course.findById(id);

    if (!course) {
        return next(
            new AppError(
                "Course not found",
                404
            )
        );
    }

   

    if (
        course.thumbnail &&
        course.thumbnail.public_id
    ) {

        await cloudinary.v2.uploader.destroy(
            course.thumbnail.public_id
        );
    }


    for (const lecture of course.lectures) {

        if (
            lecture.lecture &&
            lecture.lecture.public_id
        ) {

            await cloudinary.v2.uploader.destroy(
                lecture.lecture.public_id,
                {
                    resource_type: "video",
                }
            );
        }
    }

 
    await course.deleteOne();

    res.status(200).json({
        success: true,
        message:
            "Course deleted successfully",
    });
});

export {
    getAllCourses,
    createCourse,
    getLecturesByCourseId,
    addLectureToCourseById,
    removeLectureFromCourse,
    updateCourseById,
    deleteCourseById,
}