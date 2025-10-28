import ProfileInfo from "@/pages/profile/component/profile-info";
import React, { useEffect } from "react";
import NewDm from "./component";
import { useDispatch, useSelector } from "react-redux";
import { DirectMessages, setDirectMessagesContacts } from "@/store/chatSlice";
import ContactList from "@/components/ui/contacts-list";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/apiConfig";

function ContactContainer() {
  const dispatch = useDispatch();
  const DirectMessagesContacts = useSelector(DirectMessages)
  useEffect(() => {
    const getContacts = async () => {
      const response = await axios.get(
        API_ENDPOINTS.contacts.getContactList,
        { withCredentials: true }
      );

      if (response.data.contacts) {
        console.log(response) 
        dispatch(setDirectMessagesContacts(response.data.contacts));
      }
    };
    getContacts();
  }, []);
  return (
    <div className="relative md:w-[35vw] lg:w-[30vw] xl:w-[20vw] border-r border-white/10 w-full bg-[oklch(0.16_0.03_265)]/60 backdrop-blur-xl">
      <div className="pt-4">
        <Logo />
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Direct Messages" />
          <NewDm />
        </div>
        <div className="max-h-[30vh] overflow-y-auto scrollbar-hidden">
          <ContactList contacts={DirectMessagesContacts} />
        </div>
      </div>
      <div className="my-5">
        <div className="flex items-center justify-between pr-10">
          <Title text="Channels" />
        </div>
      </div>
      <ProfileInfo />
    </div>
  );
}

export default ContactContainer;

const Logo = () => {
  return (
    <div className="flex p-5 justify-start items-center gap-2">
      <svg
        id="logo-38"
        width="78"
        height="32"
        viewBox="0 0 78 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {" "}
        <path
          d="M55.5 0H77.5L58.5 32H36.5L55.5 0Z"
          className="ccustom"
          fill="#8338ec"
        ></path>{" "}
        <path
          d="M35.5 0H51.5L32.5 32H16.5L35.5 0Z"
          className="ccompli1"
          fill="#975aed"
        ></path>{" "}
        <path
          d="M19.5 0H31.5L12.5 32H0.5L19.5 0Z"
          className="ccompli2"
          fill="#a16ee8"
        ></path>{" "}
      </svg>
      <span className="text-3xl font-semibold">YouChat</span>
    </div>
  );
};

export { Logo };

export const Title = ({ text }) => {
  return (
    <h6 className="uppercase tracking-widest text-neutral-400 pl-10 font-light text-opacity-90 text-sm">
      {text}
    </h6>
  );
};
