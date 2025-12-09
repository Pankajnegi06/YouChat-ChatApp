import { createSlice } from "@reduxjs/toolkit";


const InitialValue = {
    userInfo:null,
}
const userSlice = createSlice({
    initialState:InitialValue,
    name:"user",
    reducers:{
        setUserInfo:(state,action)=>{
            state.userInfo = action.payload
        },
        clearUserInfo:(state)=>{
            state.userInfo = null;
        }
    }
})
export const { setUserInfo, clearUserInfo } = userSlice.actions;
export const selectUser = (state) => state.user.userInfo;

export default userSlice.reducer;