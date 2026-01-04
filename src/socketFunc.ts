import type { Server, Socket } from "socket.io";
import { prisma } from "./services/prisma.service";

type TaskJoinPayload = {
    taskId?: string;
};

const ensureTaskAccess = async (socket: Socket, taskId: string) => {
    // Replace with actual RBAC logic; rely on socket.data to identify the user.
    const hasAccess = Boolean(socket.data?.userId);
    if (!hasAccess) {
        throw new Error("NOT_AUTHORIZED");
    }
};

export const onConnectSocket = (socket: Socket, io: Server) => {
    socket.on("task:join", async ({ taskId }: TaskJoinPayload = {}) => {
        const userId = socket.data.userId;
        if (!taskId || !userId) {
            socket.emit("task:error", { message: "taskId is required" });
            return;
        }

        try {
            // await ensureTaskAccess(socket, taskId);
            const room = `task:${taskId}`; 
            await socket.join(room);
            socket.emit("task:joined", { taskId, room });
        } catch (error) {
            socket.emit("task:error", {
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    });
    
    socket.on("task:comment:create", async (data) => {
        const userId = socket.data.userId;
        const { taskId, content } = data;
        if (!taskId) {
            socket.emit("task:error", { message: "taskId is required" });
            return;
        }
        const tasks = await prisma.taskDiscussion.create({
            data: {
                content: content,
                taskId: taskId,
                createdBy: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        });

        io.to(`task:${taskId}`).emit("task:comment:new",{
            id: tasks.id,
            content: tasks.content,
            createdAt: tasks.createdAt,
            user: {
                id: tasks.user.id,
                name: tasks.user.name,
                email: tasks.user.email,
                avatarUrl: tasks.user.avatarUrl
            }
        });
    });
};

export default onConnectSocket;